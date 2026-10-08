export class RegistrationReminderEvent {
  constructor(
    public readonly userId: string,
    public readonly scheduleId: string,
    public readonly studentId: string,
    public readonly corrected = false,
  ) {}
}
