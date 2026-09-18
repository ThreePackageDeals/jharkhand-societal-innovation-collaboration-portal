ALTER TABLE "User"
  ADD COLUMN "otp" TEXT,
  ADD COLUMN "otpExpires" TIMESTAMP(3),
  ADD COLUMN "sheerIdVerificationId" TEXT;

CREATE UNIQUE INDEX "User_sheerIdVerificationId_key" ON "User"("sheerIdVerificationId");

CREATE TABLE "OtpChallenge" (
  "identifier" TEXT NOT NULL,
  "otpHash" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "OtpChallenge_pkey" PRIMARY KEY ("identifier")
);
