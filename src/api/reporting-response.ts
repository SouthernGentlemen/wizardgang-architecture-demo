import { assuranceJsonResponse } from './assurance-contract';
import {
  assertReportingContract,
  type ReportingContractDefinition,
} from '../reporting/schema-validation';

interface ReportingResponseOptions {
  status?: number;
  headers?: HeadersInit;
  cacheControl?: string;
  etag?: boolean;
}

export function reportingJsonResponse(
  request: Request,
  data: unknown,
  definition: ReportingContractDefinition,
  options: ReportingResponseOptions = {},
): Response {
  assertReportingContract(data, definition);
  return assuranceJsonResponse(request, data, options);
}
