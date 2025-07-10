export const getPagination = ({ totalItems, page, limit }) => {
  const totalPages = Math.ceil(totalItems / limit)
  return {
    totalItems,
    totalPages,
    page,
    limit,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  }
}
