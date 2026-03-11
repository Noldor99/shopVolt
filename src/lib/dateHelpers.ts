import dayjs from 'dayjs'

export const dateHelpers = {
  getDayMonthYear: (date?: Date | string) => dayjs(date).format('DD/MM/YYYY'),
}
