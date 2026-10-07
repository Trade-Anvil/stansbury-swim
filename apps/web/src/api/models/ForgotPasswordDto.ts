/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type ForgotPasswordDto = {
    /**
     * User email address
     */
    email: string;
    /**
     * Cloudflare Turnstile token. Required once TURNSTILE_SECRET_KEY is set.
     */
    turnstileToken?: string;
};

