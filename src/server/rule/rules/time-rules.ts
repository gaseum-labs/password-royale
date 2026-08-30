import { ALL_PRIME } from '../partition.js';
import { createRuleFactory, createRuleTitle } from '../rule-registry.js';
import { numberPostfix } from '../rule-util.js';

export const createCurrentHourRule = createRuleFactory({
	title: createRuleTitle`Must include the current hour in **HST** (UTC -10)`,
	validator:
		() =>
		({ password }) => {
			const epoch = new Date();
			epoch.setUTCHours(epoch.getUTCHours() - 10);
			const requiredHour = (epoch.getUTCHours() % 12).toString();
			if (!password.includes(requiredHour)) {
				return `It is ${requiredHour} in Hawaii`;
			}
		},
});

export const createCurrentWeekdayRule = createRuleFactory({
	title: createRuleTitle`Must include the current **day of the week**`,
	validator:
		() =>
		({ password }) => {
			const weekday = new Intl.DateTimeFormat('en-US', {
				weekday: 'long',
			}).format(new Date());
			if (!password.toLowerCase().includes(weekday.toLowerCase())) {
				return `It is ${weekday}`;
			}
		},
});

export const createCurrentDayOfMonthRule = createRuleFactory({
	title: createRuleTitle`Must include the current **day of the month**`,
	validator:
		() =>
		({ password }) => {
			const date = new Date().getDate();
			if (!password.includes(date.toString())) {
				return `It is the ${date}${numberPostfix(date)} of the month`;
			}
		},
});

export const createCurrentYearRule = createRuleFactory({
	title: createRuleTitle`Must include the current **year**`,
	validator:
		() =>
		({ password }) => {
			const year = new Date().getFullYear();
			if (!password.includes(year.toString())) {
				return `It is ${year}`;
			}
		},
});

export const createCurrentMonthRule = createRuleFactory({
	title: createRuleTitle`Must include the current **month**`,
	validator:
		() =>
		({ password }) => {
			const month = new Intl.DateTimeFormat('en-US', {
				month: 'long',
			}).format(new Date());
			if (!password.toLowerCase().includes(month.toLowerCase())) {
				return `It is ${month}`;
			}
		},
});

export const createCurrenteDateRule = createRuleFactory({
	title: createRuleTitle`Must include the current date in **month/day/year**`,
	validator:
		() =>
		({ password }) => {
			const dateString = new Intl.DateTimeFormat('en-US').format(
				new Date(),
			);
			if (!password.toLowerCase().includes(dateString)) {
				return `Current date: ${dateString}`;
			}
		},
	partitions: ALL_PRIME('any'),
});
