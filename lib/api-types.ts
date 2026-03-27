export type ApiSuccessResponse<T> = {
  success: true;
  data: T;
};

export type ApiErrorDetail = {
  code: string;
  message: string;
  details?: Record<string, unknown>;
};

export type ApiErrorResponse = {
  success: false;
  error: ApiErrorDetail;
};

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;
