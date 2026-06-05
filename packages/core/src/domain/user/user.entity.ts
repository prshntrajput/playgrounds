import { UserRole } from "@playgrounds/shared";

export interface UserProps {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
  role: UserRole;
  createdAt: Date;
}

export class UserEntity {
  private constructor(private readonly props: UserProps) {}

  static create(props: UserProps): UserEntity {
    return new UserEntity(props);
  }

  get id() { return this.props.id; }
  get email() { return this.props.email; }
  get name() { return this.props.name; }
  get avatar() { return this.props.avatar; }
  get role() { return this.props.role; }
  get createdAt() { return this.props.createdAt; }

  isAdmin() { return this.props.role === "ADMIN"; }
  isUser() { return this.props.role === "USER" || this.isAdmin(); }
}
