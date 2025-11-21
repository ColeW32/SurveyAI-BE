import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
	constructor() {
		super({
			jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
			ignoreExpiration: false,
			secretOrKey: '9e4f36b2ad0e453c84a5ff5f02de1c7caa92d394fe7c4bc2808b3e3a7d59c140c01de929c7d7a5bd0fcd9b452b4416a07cbf28d73e1b11dfe9379dbad73fdb34',
		});
	}

	async validate(payload: any) {
		return { userId: payload.sub };
	}
}