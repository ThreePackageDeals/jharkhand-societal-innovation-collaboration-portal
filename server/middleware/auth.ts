import { Request, Response, NextFunction } from 'express';
import { authService, TokenPayload } from '../modules/auth/auth.service';
import { sendError } from '../utils/apiResponse';
import { Role, VerificationStatus } from '@prisma/client';

export interface AuthRequest extends Request {
  user?: TokenPayload;
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;


  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return sendError(res, 'Authentication token required', 401, 'UNAUTHORIZED');
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = await authService.verifyToken(token);
    req.user = decoded;
    next();
  } catch (err: any) {
    return sendError(res, err.message, 401, 'INVALID_TOKEN');
  }
};

export const requireRole = (...allowedRoles: Role[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return sendError(res, 'User not authenticated', 401, 'UNAUTHORIZED');
    }


    if (!allowedRoles.includes(req.user.role)) {
      return sendError(
        res,
        `Access denied. Required roles: ${allowedRoles.join(', ')}`,
        403,
        'FORBIDDEN'
      );
    }

    next();
  };
};

// Backward-compatible alias used by existing route modules.
export const roleGuard = requireRole;

export const requireVerified = () => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return sendError(res, 'User not authenticated', 401, 'UNAUTHORIZED');
    }


    // CITIZENS are considered verified by default (NOT_REQUIRED)
    if (req.user.role === 'CITIZEN' || req.user.verificationStatus === 'VERIFIED' || req.user.verificationStatus === 'NOT_REQUIRED') {
      return next();
    }

    return sendError(res, 'Verification required to access this resource', 403, 'VERIFICATION_PENDING');
  };
};
