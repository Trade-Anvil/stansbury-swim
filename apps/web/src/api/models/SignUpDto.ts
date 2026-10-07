/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type SignUpDto = {
    /**
     * User email address
     */
    email: string;
    /**
     * User password
     */
    password: string;
    /**
     * First name
     */
    firstName: string;
    /**
     * Last name
     */
    lastName: string;
    /**
     * User phone number
     */
    phoneNumber: string;
    /**
     * Cloudflare Turnstile token. Required once TURNSTILE_SECRET_KEY is set.
     */
    turnstileToken?: string;
};

