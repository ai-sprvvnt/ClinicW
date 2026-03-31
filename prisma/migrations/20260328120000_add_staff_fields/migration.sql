-- CreateEnum
CREATE TYPE "StaffType" AS ENUM ('Profesional', 'PracticasProfesionales', 'ServicioSocial', 'PersonalInterno');

-- AlterTable
ALTER TABLE "Doctor" ADD COLUMN     "career" TEXT,
ADD COLUMN     "degree" TEXT,
ADD COLUMN     "license" TEXT,
ADD COLUMN     "roleDescription" TEXT,
ADD COLUMN     "staffType" "StaffType" NOT NULL DEFAULT 'Profesional';

-- CreateIndex
CREATE UNIQUE INDEX "Doctor_license_key" ON "Doctor"("license");

