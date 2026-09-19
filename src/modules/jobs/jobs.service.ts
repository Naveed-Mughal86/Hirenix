// // src/modules/jobs/jobs.service.ts
// import { NotFoundError, ForbiddenError } from '../../shared/errors';

// export async function getJob(jobId: string, requestingCompanyId: string) {
//   const job = await jobsRepo.findById(jobId);
//   if (!job) throw new NotFoundError('Job not found');
//   if (job.companyId !== requestingCompanyId) throw new ForbiddenError('Access denied');
//   return job;
// }