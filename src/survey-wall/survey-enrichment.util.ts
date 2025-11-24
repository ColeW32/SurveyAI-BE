import * as crypto from 'crypto';
import * as seedrandom from 'seedrandom';

function shuffleArray(array: any[], rng: () => number) {
	for (let i = array.length - 1; i > 0; i--) {
		const j = Math.floor(rng() * (i + 1));
		[array[i], array[j]] = [array[j], array[i]];
	}
}

function generateDeterministicValues(seed: string) {
	const rng = seedrandom(seed);

	const ratingRoll = rng();
	const reviewRoll = rng();

	const reviewCount = Math.floor(reviewRoll * 1399) + 1;

	return { ratingRoll, reviewCount };
}

export function enrichSurveysWithSyntheticData(surveys: any[], userId: string): any[] {
	const pageSeed = surveys.map(s => s.surveyId).join('-') + userId;
	const pageRng = seedrandom(pageSeed);

	const surveyIndices = surveys.map((_, index) => index);
	shuffleArray(surveyIndices, pageRng);

	const lowRatingIndices = surveyIndices.slice(0, 2);
	const mediumRatingIndices = surveyIndices.slice(2, 5);
	const highRatingIndices = surveyIndices.slice(5);


	return surveys.map((survey, index) => {
		if (survey.isPlaceholder) {
			return { ...survey, rating: 'N/A', reviewCount: 0 };
		}

		const seed = crypto.createHash('sha256').update(survey.surveyId + userId).digest('hex');
		const { ratingRoll, reviewCount } = generateDeterministicValues(seed);

		let rating: number;

		if (lowRatingIndices.includes(index)) {
			rating = 1.0 + ratingRoll * 2.9;
		} else if (mediumRatingIndices.includes(index)) {
			rating = 4.0 + ratingRoll * 0.4;
		} else {
			rating = 4.7 + ratingRoll * 0.3;
		}

		if (highRatingIndices.includes(index) && ratingRoll > 0.9) {
			rating = 5.0;
		}

		return {
			...survey,
			rating: rating.toFixed(1),
			reviewCount: lowRatingIndices.includes(index) ? Math.floor(reviewCount / 5) : reviewCount,
		};
	});
}