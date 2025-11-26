import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { BlacklistService } from './blacklist/blacklist.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
	constructor(
		private readonly blacklistService: BlacklistService,
		private readonly configService: ConfigService,
	) {
		const jwtSecret = configService.get<string>('JWT_SECRET');

		if (!jwtSecret) {
			throw new Error('JWT_SECRET is not defined in the environment variables!');
		}

		super({
			jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
			ignoreExpiration: false,
			secretOrKey: jwtSecret,
		});
	}

	async validate(payload: any) {
		if (!payload.jti) {
			throw new UnauthorizedException('Token is missing JTI.');
		}

		const isBlacklisted = await this.blacklistService.isBlacklisted(payload.jti);
		if (isBlacklisted) {
			throw new UnauthorizedException('Token has been revoked.');
		}

		return { userId: payload.sub, jti: payload.jti, exp: payload.exp };
	}
}