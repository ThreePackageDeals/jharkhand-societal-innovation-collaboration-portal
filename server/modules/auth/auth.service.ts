import { randomUUID } from 'crypto';
import jwt from 'jsonwebtoken';
import { ENV } from '../../config/env';
import { prisma } from '../../config/db';
import { Role, VerificationStatus, OrgType } from '@prisma/client';
import { sheerIdService } from '../../services/sheerid.service';
import { otpService } from '../../services/otp.service';

export interface TokenPayload {
  userId: string;
  email: string;
  role: Role;
  verificationStatus: VerificationStatus;
}

interface RegistrationTokenPayload {
  purpose: 'registration';
  email?: string;
  phone?: string;
  userId?: string;
}

interface GoogleOAuthStatePayload {
  purpose: 'google-oauth' | 'google-link';
  nonce: string;
  userId?: string;
}

export class AuthService {
  async sendOtp(identifier: string) {
    return otpService.sendOtp(identifier);
  }

  async verifyOtp(identifier: string, otp: string, registrationToken?: string) {
    const verification = await otpService.verifyOtp(identifier, otp);
    if (!verification.valid) return { valid: false };
    return {
      valid: true,
      ...this.recordOtpVerification(registrationToken, verification.identifier, verification.channel),
    };
  }

  createGoogleOAuthState(purpose: 'google-oauth' | 'google-link' = 'google-oauth', userId?: string) {
    return jwt.sign({ purpose, nonce: randomUUID(), userId }, ENV.JWT_SECRET, { expiresIn: '10m' });
  }

  verifyGoogleOAuthState(state: string) {
    return Boolean(this.readGoogleOAuthState(state));
  }

  readGoogleOAuthState(state: string): GoogleOAuthStatePayload | null {
    try {
      const payload = jwt.verify(state, ENV.JWT_SECRET) as Partial<GoogleOAuthStatePayload>;
      if ((payload.purpose !== 'google-oauth' && payload.purpose !== 'google-link') || !payload.nonce) return null;
      return payload as GoogleOAuthStatePayload;
    } catch {
      return null;
    }
  }

  async loginWithGoogle(email: string, googleSubject: string, googleName?: string) {
    const linkedUser = await prisma.user.findUnique({ where: { googleSubject } });
    const emailUser = await prisma.user.findUnique({ where: { email } });
    if (linkedUser && emailUser && linkedUser.id !== emailUser.id) {
      throw new Error('This Google account and email belong to different portal accounts');
    }
    const user = linkedUser || emailUser;
    if (!user || !user.isActive) throw new Error('No active portal account is registered for this Google email');

    const updatedUser = user.googleSubject === googleSubject
      ? user
      : await prisma.user.update({
          where: { id: user.id },
          data: {
            googleSubject,
            ...(user.fullName ? {} : { fullName: googleName || user.fullName }),
          },
        });
    return this.issueAccessToken(updatedUser);
  }

  async linkGoogleAccount(userId: string, email: string, googleSubject: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.isActive) throw new Error('Portal account not found');

    const existingGoogleUser = await prisma.user.findUnique({ where: { googleSubject } });
    if (existingGoogleUser && existingGoogleUser.id !== userId) {
      throw new Error('This Google account is already linked to another portal account');
    }
    const existingEmailUser = await prisma.user.findUnique({ where: { email } });
    if (existingEmailUser && existingEmailUser.id !== userId) {
      throw new Error('This Google email is already connected to another portal account');
    }

    await prisma.user.update({ where: { id: userId }, data: { googleSubject } });
    return { linked: true, email };
  }

  async completeProfile(userId: string, data: {
    email: string;
    fullName: string;
    role: Role;
    phone?: string;
    district?: string;
    universityId?: string;
    studentIdNumber?: string;
    department?: string;
    employeeId?: string;
    designation?: string;
    organizationId?: string;
    organizationName?: string; // For creating new organization
    registrationNumber?: string;
    website?: string;
    orgType?: OrgType;
    industryDesignation?: string;
    citizenSubmitterType?: string;
    documentUrls?: string[];
  }) {
    const { role, email, fullName, phone, district, ...rest } = data;

    // Enforce one account → one role: prevent role changes after initial registration
    const existingUser = await prisma.user.findUnique({ where: { id: userId } });
    if (existingUser && existingUser.role && existingUser.role !== role) {
      throw new Error('Cannot change role after account creation. Your account is registered as ' + existingUser.role);
    }

    // 1. Create or update the base User record
    const user = await prisma.user.upsert({
      where: { id: userId },
      update: {
        fullName,
        role,
        phone,
        district,
        citizenSubmitterType: role === 'CITIZEN' ? rest.citizenSubmitterType : null,
        emailVerifiedAt: new Date(),
        phoneVerifiedAt: new Date(),
      } as any,
      create: {
        id: userId,
        email,
        emailVerifiedAt: new Date(),
        fullName,
        role,
        phone,
        phoneVerifiedAt: new Date(),
        district,
        citizenSubmitterType: role === 'CITIZEN' ? rest.citizenSubmitterType : null,
        verificationStatus: 'NOT_REQUIRED',
      } as any,
    });

    let verificationStatus: VerificationStatus = 'NOT_REQUIRED';
    const verificationRequests: any[] = [];
    let sheerIdVerificationUrl: string | undefined;

    if (role === 'STUDENT' || role === 'FACULTY') {
      if (!rest.universityId) throw new Error('University is required for students and faculty');

      const university = await prisma.university.findUnique({
        where: { id: rest.universityId },
      });
      if (!university) throw new Error('University not found');

      const isDomainVerified = ENV.ENABLE_STUDENT_DOMAIN_FAST_TRACK
        && this.matchesUniversityDomain(email, university.domains);

      if (role === 'STUDENT') {
        await prisma.studentProfile.upsert({
          where: { userId },
          update: {
            universityId: rest.universityId,
            studentIdNumber: rest.studentIdNumber,
            department: rest.department,
          },
          create: {
            userId,
            universityId: rest.universityId,
            studentIdNumber: rest.studentIdNumber,
            department: rest.department,
          },
        });

        if (!isDomainVerified) {
          verificationStatus = 'PENDING';
          const verification = await sheerIdService.createVerification();
          sheerIdVerificationUrl = verification.verificationUrl;
          await prisma.user.update({
            where: { id: userId },
            data: { sheerIdVerificationId: verification.verificationId },
          });
        } else {
          verificationStatus = 'VERIFIED';
          await prisma.studentProfile.update({
            where: { userId },
            data: { verifiedAt: new Date(), verifiedById: 'domain-fast-track' },
          });
        }
      } else { // FACULTY
        await prisma.facultyProfile.upsert({
          where: { userId },
          update: {
            universityId: rest.universityId,
            employeeId: rest.employeeId,
            designation: rest.designation,
            department: rest.department,
          },
          create: {
            userId,
            universityId: rest.universityId,
            employeeId: rest.employeeId,
            designation: rest.designation,
            department: rest.department,
          },
        });

        // Faculty always requires admin confirmation, but domain match can expedite
        verificationStatus = 'PENDING';
        verificationRequests.push({
          userId,
          role,
          documentUrls: rest.documentUrls || [],
          status: 'PENDING',
        });
      }
    } else if (role === 'INDUSTRY_REP') {
      verificationStatus = 'PENDING';

      let orgId = rest.organizationId;
      if (!orgId && rest.organizationName) {
        const org = await prisma.organization.create({
          data: {
            name: rest.organizationName,
            type: rest.orgType || 'CORPORATE',
            registrationNumber: rest.registrationNumber,
            website: rest.website,
            isVerified: false,
          },
        });
        orgId = org.id;
      }

      if (!orgId) throw new Error('Organization is required');

      await prisma.industryProfile.upsert({
        where: { userId },
        update: {
          organizationId: orgId,
          designation: rest.industryDesignation,
        },
        create: {
          userId,
          organizationId: orgId,
          designation: rest.industryDesignation,
        },
      });

      if (!rest.documentUrls || rest.documentUrls.length === 0) {
        throw new Error('Registration documents required for industry representatives');
      }

      verificationRequests.push({
        userId,
        role,
        documentUrls: rest.documentUrls,
        status: 'PENDING',
      });
    } else if (role === 'GOVERNMENT_OFFICIAL') {
      verificationStatus = 'PENDING';

      if (!rest.documentUrls || rest.documentUrls.length === 0) {
        throw new Error('Government ID and authorization documents required for government officials');
      }

      verificationRequests.push({
        userId,
        role,
        documentUrls: rest.documentUrls,
        status: 'PENDING',
      });
    }

    // Update User verification status and create requests
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        verificationStatus,
        ...(role === 'CITIZEN' ? { verificationStatus: 'NOT_REQUIRED' } : {})
      },
    });

    if (verificationRequests.length > 0) {
      await prisma.verificationRequest.createMany({
        data: verificationRequests,
      });
    }

    return {
      user: updatedUser,
      verificationStatus,
      accessToken: this.issueAccessToken(updatedUser),
      sheerIdVerificationUrl,
    };
  }

  async getMe(userId: string, useDevUser = false) {
    if (useDevUser && userId === 'dev-user-id') {
      return {
        id: 'dev-user-id',
        email: 'dev@localhost',
        fullName: 'Development User',
        role: 'GOVERNMENT_ADMIN' as Role,
        verificationStatus: 'NOT_REQUIRED' as VerificationStatus,
        district: 'Ranchi',
        isActive: true,
      };
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        studentProfile: { include: { university: true } },
        facultyProfile: { include: { university: true } },
        industryProfile: {
          include: { organization: true }
        }
      },
    });
    if (!user) throw new Error('User not found');

    const { googleSubject, ...safeUser } = user;
    return {
      ...safeUser,
      accountConnections: {
        email: Boolean(user.email && user.emailVerifiedAt),
        phone: Boolean(user.phone && user.phoneVerifiedAt),
        google: Boolean(googleSubject),
      },
    };
  }

  recordOtpVerification(existingToken: string | undefined, identifier: string, channel: 'email' | 'sms') {
    let state: RegistrationTokenPayload = { purpose: 'registration' };
    if (existingToken) state = this.verifyRegistrationToken(existingToken, false);

    if (channel === 'email') state.email = identifier;
    else state.phone = identifier;
    if (state.email && state.phone && !state.userId) state.userId = randomUUID();

    return {
      registrationToken: jwt.sign(state, ENV.JWT_SECRET, { expiresIn: '15m' }),
      emailVerified: Boolean(state.email),
      phoneVerified: Boolean(state.phone),
      readyForProfile: Boolean(state.userId),
    };
  }

  verifyRegistrationToken(token: string, requireComplete = true): RegistrationTokenPayload {
    try {
      const payload = jwt.verify(token, ENV.JWT_SECRET) as RegistrationTokenPayload;
      if (payload.purpose !== 'registration' || (requireComplete && (!payload.userId || !payload.email || !payload.phone))) {
        throw new Error('Complete email and SMS verification before creating a profile');
      }
      return payload;
    } catch (error) {
      if (error instanceof Error && error.message.startsWith('Complete email')) throw error;
      throw new Error('Your verification session has expired. Please request new codes.');
    }
  }

  async processSheerIdWebhook(
    rawBody: Buffer,
    signature: string | undefined,
    event: { verificationId?: string; notifierEventType?: string },
  ) {
    if (!sheerIdService.verifyWebhookSignature(rawBody, signature)) {
      throw new Error('Invalid SheerID webhook signature');
    }
    if (!event.verificationId) throw new Error('SheerID webhook is missing a verification ID');
    if (event.notifierEventType && event.notifierEventType !== 'SUCCESS') return { updated: false };

    const details = await sheerIdService.getVerificationDetails(event.verificationId);
    if (details.lastResponse?.currentStep?.toLowerCase() !== 'success') return { updated: false };

    const user = await prisma.user.findUnique({ where: { sheerIdVerificationId: event.verificationId } });
    if (!user) return { updated: false };

    await prisma.$transaction([
      prisma.user.update({ where: { id: user.id }, data: { verificationStatus: 'VERIFIED' } }),
      prisma.studentProfile.update({ where: { userId: user.id }, data: { verifiedAt: new Date(), verifiedById: 'sheerid' } }),
    ]);
    return { updated: true };
  }

  private issueAccessToken(user: { id: string; email: string | null; role: Role; verificationStatus: VerificationStatus }) {
    return jwt.sign(
      { userId: user.id, email: user.email || '', role: user.role, verificationStatus: user.verificationStatus },
      ENV.JWT_SECRET,
      { expiresIn: '24h' },
    );
  }

  private matchesUniversityDomain(email: string, domains: string[]): boolean {
    if (!email) return false;
    const emailDomain = email.split('@')[1]?.toLowerCase();
    return domains.some(domain => domain.toLowerCase() === emailDomain || emailDomain?.endsWith(`.${domain.toLowerCase()}`));
  }

  async verifyToken(token: string): Promise<TokenPayload> {
    try {
      return jwt.verify(token, ENV.JWT_SECRET) as TokenPayload;
    } catch (err) {
      throw new Error('Invalid or expired token');
    }
  }
}

export const authService = new AuthService();
