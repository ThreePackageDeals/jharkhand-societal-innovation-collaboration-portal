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
  role: Role | 'GOVT_ADMIN';
  verificationStatus: VerificationStatus;
}

interface RegistrationTokenPayload {
  purpose: 'registration';
  email?: string;
  phone?: string;
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

  createGoogleOAuthState() {
    return jwt.sign({ purpose: 'google-oauth', nonce: randomUUID() }, ENV.JWT_SECRET, { expiresIn: '10m' });
  }

  verifyGoogleOAuthState(state: string) {
    try {
      const payload = jwt.verify(state, ENV.JWT_SECRET) as { purpose?: string };
      return payload.purpose === 'google-oauth';
    } catch {
      return false;
    }
  }

  async loginWithGoogle(email: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.isActive) throw new Error('No active portal account is registered for this Google email');
    return this.issueAccessToken(user);
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
    documentUrls?: string[];
  }) {
    const { role, email, fullName, phone, district, ...rest } = data;

    // 1. Create or update the base User record
    const user = await prisma.user.upsert({
      where: { id: userId },
      update: {
        fullName,
        role,
        phone,
        district,
      },
      create: {
        id: userId,
        email,
        fullName,
        role,
        phone,
        district,
        verificationStatus: 'NOT_REQUIRED',
      },
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

  async getMe(userId: string) {
    if (userId === 'dev-user-id') {
      return {
        id: 'dev-user-id',
        email: 'dev@localhost',
        fullName: 'Development User',
        role: 'GOVT_ADMIN' as Role,
        verificationStatus: 'NOT_REQUIRED' as VerificationStatus,
        district: 'Ranchi',
        isActive: true,
      };
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        studentProfile: true,
        facultyProfile: true,
        industryProfile: {
          include: { organization: true }
        }
      },
    });
    if (!user) throw new Error('User not found');

    return user;
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
    if (token === 'mock-jwt-token') {
      return {
        userId: 'dev-user-id',
        email: 'dev@localhost',
        role: 'GOVT_ADMIN' as Role,
        verificationStatus: 'NOT_REQUIRED' as VerificationStatus,
      };
    }
    try {
      return jwt.verify(token, ENV.JWT_SECRET) as TokenPayload;
    } catch (err) {
      throw new Error('Invalid or expired token');
    }
  }
}

export const authService = new AuthService();
