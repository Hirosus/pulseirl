export const SEED_EVENTS = [
  {
    id: 'ev_rooftop_vinyl',
    title: 'Rooftop Vinyl Session & Mezcal Tasting',
    description: 'Intimate listening session playing rare West African highlife, Afrobeat, and tropical disco on original pressing vinyl with artisanal mezcal pairings.',
    venue: '14 Akin Adesola, Victoria Island, Lagos',
    latitude: 6.4281,
    longitude: 3.4219,
    capacity: 40,
    availableSeats: 8,
    status: 'LIVE_DROP',
    dropTime: new Date(Date.now() + 1000 * 60 * 30) // in 30 mins
  },
  {
    id: 'ev_secret_supper',
    title: 'Underground Neo-Yoruba Supper Club',
    description: 'A 6-course modernist Nigerian culinary experience curated by Chef Folake, paired with natural palm wines.',
    venue: 'Lekki Phase 1 Waterfront, Lagos',
    latitude: 6.4474,
    longitude: 3.4731,
    capacity: 25,
    availableSeats: 25,
    status: 'UPCOMING',
    dropTime: new Date(Date.now() + 1000 * 60 * 60 * 4) // in 4 hours
  },
  {
    id: 'ev_padel_highlife',
    title: 'Midnight Padel & Electro-Highlife Tournament',
    description: 'Casual round-robin padel matches with live DJ sets, cold brew matcha, and networking for tech founders and designers.',
    venue: 'Padel Club Lagos, Landmark Beach, VI',
    latitude: 6.4253,
    longitude: 3.4398,
    capacity: 32,
    availableSeats: 0,
    status: 'SOLD_OUT',
    dropTime: new Date(Date.now() - 1000 * 60 * 120) // 2 hours ago
  }
];
