import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';

export interface PureSpectrumSurvey {
	surveyId: string | number;
	cpi: number;
	estimatedLoi: number;
	entryLink: string;
	isPlaceholder: boolean
}

@Injectable()
export class PureSpectrumService {
	private readonly logger = new Logger(PureSpectrumService.name);
	private readonly apiKey: string;
	private readonly baseUrl: string;

	constructor(
		private readonly httpService: HttpService,
		private readonly configService: ConfigService,
	) {
		const apiKey = this.configService.get<string>('PURESPECTRUM_API_KEY');
		const baseUrl = this.configService.get<string>('PURESPECTRUM_BASE_URL');
		if (!apiKey || !baseUrl) {
			this.logger.error('PURESPECTRUM_API_KEY/PURESPECTRUM_BASE_URL is not configured!');
			throw new InternalServerErrorException('Pure Spectrum service is not configured.');
		}

		this.apiKey = apiKey;
		this.baseUrl = baseUrl;
	}



	async fetchSurveys(
		params: {
			memberId: string;
			respondentId: string;
			ipAddress: string;
			userAgent: string;
			profileData: Record<string, string>;
			maxNumberOfSurveysReturned?: number;
		}
	): Promise<PureSpectrumSurvey[]> {

		const apiParams = {
			...params.profileData,
			memberId: params.memberId,
			respondentId: params.respondentId,
			ipAddress: params.ipAddress,
			userAgent: params.userAgent,
			maxNumberOfSurveysReturned: params.maxNumberOfSurveysReturned || 20,
			respondentLocalization: 'en_US',
		};

		try {
			const response = await firstValueFrom(
				this.httpService.get(this.baseUrl, {
					headers: { 'access-token': this.apiKey },
					params: apiParams,
				})
			);
			return response.data?.surveys || [];
		} catch (error) {
			const axiosError = error as AxiosError;
			this.logger.error(
				`PureSpectrum API error for user ${params.memberId}: ${axiosError.message}`,
				axiosError.response?.data
			);
			return [];
		}
	}
}