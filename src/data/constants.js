// Reference lists for the demo dataset. Beats are approximate points around
// Pulianthope (13.0982 N, 80.2683 E) used only to place sample incidents.

export const TODAY = new Date('2026-09-29T11:00:00+05:30')
export const MAP_CENTER = [13.1022, 80.2635]

// Fixed categorical order (validated for the dark surface). Colour follows the
// crime type everywhere in the app, never its rank.
export const CRIME_TYPES = [
  { id: 'chain', label: 'Chain Snatching', ta: 'சங்கிலி பறிப்பு', color: '#2a78d6', weight: 24,
    hours: [6, 6, 7, 7, 7, 8, 8, 9, 10, 17, 18, 18, 19, 19, 20, 20, 21] },
  { id: 'robbery', label: 'Robbery', ta: 'வழிப்பறி', color: '#eb6834', weight: 14,
    hours: [0, 1, 2, 21, 22, 22, 23, 23, 20, 19, 3] },
  { id: 'hb', label: 'House Break-in', ta: 'வீடு உடைப்பு', color: '#1baf7a', weight: 15,
    hours: [0, 1, 1, 2, 2, 3, 3, 4, 11, 12, 13, 14] },
  { id: 'vehicle', label: 'Two-Wheeler Theft', ta: 'இருசக்கர வாகன திருட்டு', color: '#eda100', weight: 18,
    hours: [22, 23, 0, 1, 2, 3, 4, 5, 13, 14, 15] },
  { id: 'mobile', label: 'Mobile Snatching', ta: 'கைபேசி பறிப்பு', color: '#e87ba4', weight: 16,
    hours: [7, 8, 9, 12, 17, 18, 19, 20, 21, 22] },
  { id: 'pickpocket', label: 'Pickpocketing', ta: 'பிக்பாக்கெட்', color: '#008300', weight: 9,
    hours: [8, 9, 10, 11, 12, 16, 17, 18, 19] },
  { id: 'extortion', label: 'Extortion', ta: 'மிரட்டி பணம் பறிப்பு', color: '#4a3aa7', weight: 4,
    hours: [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20] },
]
export const TYPE_BY_ID = Object.fromEntries(CRIME_TYPES.map((t) => [t.id, t]))

export const STATIONS = ['Pulianthope', 'Basin Bridge', 'Vyasarpadi', 'Otteri']

// affinity: relative likelihood of each crime type occurring on the beat
export const BEATS = [
  { id: 'phr', name: 'Pulianthope High Road', station: 'Pulianthope', lat: 13.0990, lng: 80.2680, affinity: { chain: 3, mobile: 3, robbery: 1.5, pickpocket: 2 } },
  { id: 'adt', name: 'Aadu Thotti (Slaughterhouse Rd)', station: 'Pulianthope', lat: 13.1006, lng: 80.2658, affinity: { robbery: 2.5, extortion: 3, vehicle: 1.5 } },
  { id: 'ngd', name: 'Narayanasamy Garden', station: 'Pulianthope', lat: 13.0968, lng: 80.2712, affinity: { hb: 3, vehicle: 2, chain: 1.5 } },
  { id: 'bbr', name: 'Basin Bridge Road', station: 'Basin Bridge', lat: 13.1032, lng: 80.2702, affinity: { vehicle: 2.5, mobile: 2, robbery: 2 } },
  { id: 'bbs', name: 'Basin Bridge Rly Station', station: 'Basin Bridge', lat: 13.1048, lng: 80.2672, affinity: { pickpocket: 3.5, mobile: 3, vehicle: 2 } },
  { id: 'bny', name: 'Binny Mills / Strahans Road', station: 'Pulianthope', lat: 13.0952, lng: 80.2638, affinity: { chain: 2, robbery: 2, hb: 1 } },
  { id: 'kmg', name: 'K.M. Garden', station: 'Pulianthope', lat: 13.1016, lng: 80.2612, affinity: { hb: 3, chain: 2 } },
  { id: 'dac', name: 'Dr. Ambedkar College Road', station: 'Vyasarpadi', lat: 13.1060, lng: 80.2634, affinity: { chain: 3.5, mobile: 2 } },
  { id: 'dml', name: 'Demellows Road', station: 'Vyasarpadi', lat: 13.1082, lng: 80.2598, affinity: { vehicle: 2, hb: 2, chain: 1.5 } },
  { id: 'vjs', name: 'Vyasarpadi Jeeva Station', station: 'Vyasarpadi', lat: 13.1118, lng: 80.2603, affinity: { pickpocket: 2.5, mobile: 2.5, chain: 1.5 } },
  { id: 'ptm', name: 'Pattalam Market', station: 'Otteri', lat: 13.0962, lng: 80.2588, affinity: { pickpocket: 3, chain: 2.5, mobile: 2.5 } },
  { id: 'onb', name: 'Otteri Nullah Bridge', station: 'Otteri', lat: 13.0925, lng: 80.2558, affinity: { robbery: 3, vehicle: 2 } },
  { id: 'pbr', name: 'Perambur Barracks Road', station: 'Otteri', lat: 13.0932, lng: 80.2620, affinity: { chain: 3, vehicle: 1.5, hb: 1.5 } },
]
export const BEAT_BY_ID = Object.fromEntries(BEATS.map((b) => [b.id, b]))

// Fictional gang labels for the demo only.
export const GANGS = [
  { id: 'g1', name: 'Aadu Thotti Crew', color: '#2a78d6' },
  { id: 'g2', name: 'Basin Bridge Boys', color: '#eb6834' },
  { id: 'g3', name: 'Otteri Nullah Gang', color: '#1baf7a' },
  { id: 'g4', name: 'K.M. Garden Group', color: '#eda100' },
  { id: 'g5', name: 'Pattalam Market Gang', color: '#e87ba4' },
  { id: 'g6', name: 'Barracks Road Riders', color: '#4a3aa7' },
]
export const GANG_BY_ID = Object.fromEntries(GANGS.map((g) => [g.id, g]))
export const NO_GANG_COLOR = '#a3a9b5'

export const OFFENDER_STATUSES = {
  custody: { label: 'In Custody', ta: 'காவலில்', tone: 'good' },
  bail: { label: 'On Bail', ta: 'ஜாமீனில்', tone: 'warning' },
  watch: { label: 'Under Surveillance', ta: 'கண்காணிப்பில்', tone: 'serious' },
  absconding: { label: 'Absconding', ta: 'தலைமறைவு', tone: 'critical' },
  convicted: { label: 'Convicted', ta: 'தண்டனை', tone: 'neutral' },
}

export const CASE_STATUSES = {
  investigation: { label: 'Under Investigation', tone: 'warning' },
  arrested: { label: 'Accused Arrested', tone: 'good' },
  chargesheet: { label: 'Charge Sheet Filed', tone: 'good' },
  convicted: { label: 'Convicted', tone: 'neutral' },
  undetected: { label: 'Undetected', tone: 'critical' },
}

export const FIRST_NAMES = ['Suresh', 'Karthik', 'Manikandan', 'Vignesh', 'Arun', 'Prakash', 'Rajesh', 'Senthil', 'Murugan', 'Dinesh', 'Saravanan', 'Vinoth', 'Ramesh', 'Balaji', 'Gopi', 'Ajith', 'Surya', 'Naveen', 'Sathish', 'Mani', 'Selvam', 'Pandian', 'Anand', 'Siva', 'Ravi', 'Hari', 'Deepak', 'Bharath', 'Yuvaraj', 'Sakthi', 'Imran', 'Joseph', 'Anthony', 'Rafiq', 'Stephen', 'Mohan', 'Velu', 'Kathir', 'Ilango', 'Jagan', 'Ashok', 'Sundar', 'Madhan', 'Prabhu', 'Kannan', 'Raja', 'Babu', 'Elumalai', 'Arjun', 'Gowtham']
export const FATHER_NAMES = ['Shanmugam', 'Krishnan', 'Muthu', 'Ramasamy', 'Perumal', 'Govindan', 'Subramani', 'Arumugam', 'Kuppusamy', 'Natarajan', 'Palani', 'Rajendran', 'Duraisamy', 'Ganesan', 'Venkatesan', 'Chinnasamy', 'Ismail', 'Xavier', 'Devaraj', 'Munusamy']
export const ALIASES = ['Kutty', 'Mottai', 'Karuppu', 'Vellai', 'Blade', 'Bullet', 'Kuruvi', 'Pambu', 'Appu', 'Thambi', 'Kaka', 'Scooty', 'Nondi', 'Silent', 'Puli', 'Sura', 'Tiger', 'Pistol', 'Oosi', 'Chinna', 'Periya', 'Jackie', 'Rocket', 'Kili', 'Setta', 'Manja', 'Pachai', 'Dada', 'Kathi', 'Gilli', 'Pottu', 'Beedi', 'Jolly', 'Tyson', 'Bonda', 'Machan', 'Spider', 'Kannadi', 'Chittu', 'Minnal', 'Current', 'Pakoda', 'Munthiri', 'Kuttai', 'Nethili', 'Vavval', 'Seval', 'Kokku', 'Thavalai', 'Aamai', 'Eli', 'Poonai', 'Kaalai', 'Karadi', 'Singam', 'Nari', 'Pallu', 'Dubai', 'Bombay', 'Senior', 'Junior', 'Lucky']
export const MARKS = ['Cut scar on left cheek', "Tattoo 'Amma' on right forearm", 'Mole near right eye', 'Burn mark on left hand', 'Walks with slight limp', 'Missing upper front tooth', 'Dragon tattoo on neck', 'Scar across right eyebrow', 'Stitch marks on left forearm', 'Ear piercing, both ears', 'Tattoo of trident on right hand']
export const BUILDS = ['Thin', 'Medium', 'Stout', 'Athletic']

export const MO_TEXT = {
  chain: ['Two-wheeler with pillion; pillion snatches from lone women walking in the morning', 'Follows women returning from temple or market, snatches at a turn and speeds off', 'Poses as asking for an address, then snatches the chain'],
  robbery: ['Threatens pedestrians with a knife late at night near isolated stretches', 'Targets auto drivers and delivery riders after dark', 'Waylays workers near the slaughterhouse early in the morning'],
  hb: ['Breaks the lock of houses left closed during festivals or travel', 'Enters through the rear window during daytime while residents are at work', 'Recces locked houses through a milk / paper delivery front'],
  vehicle: ['Steals parked two-wheelers using duplicate keys; sells parts in scrap markets', 'Targets bikes parked near the railway station overnight', 'Breaks handle locks and pushes the vehicle to a waiting accomplice'],
  mobile: ['Snatches phones from people talking on the roadside, escapes on a bike', 'Snatches phones from bus and train passengers at doorways'],
  pickpocket: ['Operates in crowded buses and near station foot-over-bridges', 'Works in a group of three in market crowds; one distracts'],
  extortion: ['Collects protection money from small traders and meat vendors', 'Threatens shopkeepers claiming affiliation with a local strongman'],
}

export const PHONE_BRANDS = ['Samsung Galaxy', 'Vivo', 'Redmi', 'Oppo', 'iPhone', 'Realme', 'OnePlus']
export const BIKES = ['Honda Activa', 'TVS Jupiter', 'Hero Splendor', 'Bajaj Pulsar', 'Yamaha FZ', 'TVS Apache', 'Suzuki Access', 'Royal Enfield Classic']
