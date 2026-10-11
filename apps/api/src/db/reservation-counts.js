export function reservationField(table, field) {
  if (!(
    (table === 'bookings' && field === 'slot_id') ||
    (table === 'registrations' && field === 'event_id')
  ))
    throw new Error('Unsupported reservation group');
}
export async function mongoReservationCounts(database, table, field, ids, options = {}) {
  reservationField(table, field);
  if (!ids.length) return {};
  const rows = await database
    .collection(table)
    .aggregate(
      [{ $match: { [field]: { $in: ids } } }, { $group: { _id: '$' + field, total: { $sum: 1 } } }],
      options,
    )
    .toArray();
  return Object.fromEntries(rows.map((row) => [row._id, row.total]));
}
