function buildPagination(page, pageSize, totalItems) {
  const totalPages = totalItems === 0 ? 0 : Math.ceil(totalItems / pageSize);

  return {
    page,
    pageSize,
    totalItems,
    totalPages,
  };
}

module.exports = {
  buildPagination,
};
