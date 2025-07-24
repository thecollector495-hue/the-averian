
export type MedicalRecord = {
  id: string;
  date: string; // YYYY-MM-DD
  type: 'Vet Visit' | 'Medication' | 'Health Check' | 'Note';
  details: string;
  cost?: number;
};

export const initialSpeciesData = [
    {
        name: 'Cockatoo',
        incubationPeriod: 26,
        subspecies: [
            'Sulphur-crested Cockatoo - Cacatua galerita',
            'Major Mitchell\'s Cockatoo - Lophochroa leadbeateri',
            'Galah / Rose-breasted Cockatoo - Eolophus roseicapilla',
            'Cockatiel - Nymphicus hollandicus',
            'Umbrella Cockatoo - Cacatua alba',
            'Moluccan Cockatoo - Cacatua moluccensis',
        ]
    },
    {
        name: 'Macaw',
        incubationPeriod: 28,
        subspecies: [
            'Blue-and-gold Macaw - Ara ararauna',
            'Green-winged Macaw - Ara chloropterus',
            'Scarlet Macaw - Ara macao',
            'Hyacinth Macaw - Anodorhynchus hyacinthinus',
            'Hahn\'s Macaw - Diopsittaca nobilis nobilis',
            'Severe Macaw - Ara severus',
        ]
    },
    {
        name: 'Conure',
        incubationPeriod: 24,
        subspecies: [
            'Sun Conure - Aratinga solstitialis',
            'Jenday Conure - Aratinga jandaya',
            'Green-cheeked Conure - Pyrrhura molinae',
            'Nanday Conure - Aratinga nenday',
            'Blue-crowned Conure - Thectocercus acuticaudatus',
            'Patagonian Conure - Cyanoliseus patagonus',
        ]
    },
    {
        name: 'African Grey Parrot',
        incubationPeriod: 28,
        subspecies: [
            'Congo African Grey - Psittacus erithacus',
            'Timneh African Grey - Psittacus timneh',
        ]
    },
    {
        name: 'Poicephalus',
        incubationPeriod: 26,
        subspecies: [
            'Senegal Parrot - Poicephalus senegalus',
            'Meyer\'s Parrot - Poicephalus meyeri',
            'Red-bellied Parrot - Poicephalus rufiventris',
            'Cape Parrot - Poicephalus robustus',
        ]
    },
    {
        name: 'Lovebird',
        incubationPeriod: 23,
        subspecies: [
            'Peach-faced Lovebird - Agapornis roseicollis',
            'Fischer\'s Lovebird - Agapornis fischeri',
            'Masked Lovebird - Agapornis personatus',
            'Nyasa Lovebird - Agapornis lilianae',
        ]
    },
    {
        name: 'Amazon Parrot',
        incubationPeriod: 27,
        subspecies: [
            'Blue-fronted Amazon - Amazona aestiva',
            'Yellow-naped Amazon - Amazona auropalliata',
            'Double Yellow-headed Amazon - Amazona oratrix',
            'Orange-winged Amazon - Amazona amazonica',
            'Lilac-crowned Amazon - Amazona finschi',
        ]
    },
    {
        name: 'Lory & Lorikeet',
        incubationPeriod: 25,
        subspecies: [
            'Rainbow Lorikeet - Trichoglossus moluccanus',
            'Chattering Lory - Lorius garrulus',
            'Black-capped Lory - Lorius lory',
            'Red Lory - Eos bornea',
        ]
    },
    {
        name: 'Australian Parakeet',
        incubationPeriod: 18,
        subspecies: [
            'Budgerigar - Melopsittacus undulatus',
            'Eastern Rosella - Platycercus eximius',
            'Princess Parrot - Polytelis alexandrae',
            'Red-rumped Parrot - Psephotus haematonotus',
        ]
    },
    {
        name: 'Asiatic Parakeet',
        incubationPeriod: 23,
        subspecies: [
            'Indian Ringneck Parakeet - Psittacula krameri manillensis',
            'Alexandrine Parakeet - Psittacula eupatria',
            'Plum-headed Parakeet - Psittacula cyanocephala',
            'Moustached Parakeet - Psittacula alexandri',
        ]
    },
    {
        name: 'Eclectus Parrot',
        incubationPeriod: 28,
        subspecies: [
            'Solomon Island Eclectus - Eclectus roratus solomonensis',
            'Vosmaeri Eclectus - Eclectus roratus vosmaeri',
            'Red-sided Eclectus - Eclectus roratus polychloros',
        ]
    },
    {
        name: 'Caique',
        incubationPeriod: 26,
        subspecies: [
            'Black-headed Caique - Pionites melanocephalus',
            'White-bellied Caique - Pionites leucogaster',
        ]
    }
];

export const inheritanceTypes = [
  'Autosomal Recessive',
  'Autosomal Dominant',
  'Autosomal Co-Dominant',
  'Autosomal Incomplete Dominant',
  'Sex-Linked Recessive',
  'Sex-Linked Dominant',
  'Sex-Linked Co-Dominant',
  'Polygenic',
  'Modifier',
] as const;


export type BirdFormValues = {
  species?: string;
  subspecies?: string;
  sex: "male" | "female" | "unsexed";
  ringNumber?: string;
  unbanded: boolean;
  imageUrl?: string;
  
  birthDateType: 'date' | 'year';
  birthDate?: Date;
  birthYear?: number;

  cageId?: string;
  visualMutations: string[];
  splitMutations: string[];
  fatherId?: string;
  motherId?: string;
  mateId?: string;
  offspringIds: string[];
  paidPrice?: number;
  estimatedValue?: number;
  status: 'Available' | 'Sold' | 'Deceased' | 'Hand-rearing';
  permitId?: string;
  saleDate?: Date;
  salePrice?: number;
  buyerInfo?: string;
  addToExpenses?: boolean;
  createSaleTransaction?: boolean;
  medicalRecords: MedicalRecord[];
};

export type Bird = Omit<BirdFormValues, 'cageId' | 'addToExpenses' | 'createSaleTransaction' | 'saleDate' | 'salePrice' | 'buyerInfo' | 'birthDate' | 'birthYear' | 'birthDateType'> & { 
  id: string, 
  category: 'Bird',
  species: string,
  birthDate?: string, // Stored as YYYY-MM-DD
  saleDetails?: {
    date: string;
    price: number;
    buyer: string;
  }
};

export type Cage = {
  id: string;
  name: string;
  category: 'Cage';
  birdIds: string[];
  cost?: number;
};

export type Pair = {
  id: string;
  category: 'Pair';
  maleId: string;
  femaleId: string;
  imageUrl?: string;
};

export type Egg = {
  id: string;
  laidDate: string; // YYYY-MM-DD
  expectedHatchDate?: string; // YYYY-MM-DD
  status: 'Laid' | 'Hatched' | 'Infertile' | 'Broken';
  hatchDate?: string;
  chickId?: string;
}

export type BreedingRecord = {
  id: string;
  category: 'BreedingRecord';
  pairId: string;
  startDate: string;
  eggs: Egg[];
  notes?: string;
}

export type SubTask = {
    id: string;
    text: string;
    completed: boolean;
    associatedBirdIds: string[];
};

export type NoteReminder = {
    id:string;
    category: 'NoteReminder';
    title: string;
    content?: string;
    isReminder: boolean;
    reminderDate?: string;
    isRecurring: boolean;
    recurrencePattern: 'daily' | 'weekly' | 'monthly' | 'none';
    associatedBirdIds: string[];
    subTasks: SubTask[];
    completed: boolean;
}

export type Transaction = {
  id: string;
  category: 'Transaction';
  type: 'income' | 'expense';
  date: string; // YYYY-MM-DD
  description: string;
  amount: number;
  relatedBirdId?: string;
}

export type Permit = {
  id: string;
  category: 'Permit';
  permitNumber: string;
  issuingAuthority: string;
  issueDate: string; // YYYY-MM-DD
  expiryDate?: string; // YYYY-MM-DD
}

export type CustomSpecies = {
    id: string;
    category: 'CustomSpecies';
    name: string;
    incubationPeriod: number;
    subspecies: string[];
};

export type CustomMutation = {
    id: string;
    category: 'CustomMutation';
    name: string;
    inheritance: typeof inheritanceTypes[number];
};


export type CollectionItem = Bird | Cage | Pair | BreedingRecord | NoteReminder | Transaction | Permit | CustomSpecies | CustomMutation;

export const getBirdIdentifier = (bird: Bird) => {
    if (!bird) return 'N/A';
    const identifier = bird.unbanded || !bird.ringNumber ? '(Unbanded)' : `(${bird.ringNumber})`;
    return `${bird.species} ${identifier}`;
};

const initialCustomSpecies: CustomSpecies[] = initialSpeciesData.map((s, i) => ({
    ...s,
    id: `cs_initial_${i}`,
    category: 'CustomSpecies',
}));

export const initialBirds: Bird[] = [
  {
    id: '1', species: 'Cockatoo', subspecies: 'Cockatiel - Nymphicus hollandicus', ringNumber: 'A123', unbanded: false, category: 'Bird', sex: 'male', birthDate: '2022-04-01', visualMutations: ['Lutino'], splitMutations: ['Cinnamon', 'Pied'], fatherId: undefined, motherId: undefined, mateId: '4', offspringIds: ['3'], paidPrice: 150, estimatedValue: 200, status: 'Available', permitId: 'p1', imageUrl: '', medicalRecords: [{id: 'mr1', date: '2024-06-01', type: 'Vet Visit', details: 'Annual checkup, all clear.'}]
  },
  {
    id: '2', species: 'African Grey Parrot', subspecies: 'Congo African Grey - Psittacus erithacus', ringNumber: 'B456', unbanded: false, category: 'Bird', sex: 'female', birthDate: '2021-06-15', visualMutations: [], splitMutations: ['Lutino'], fatherId: undefined, motherId: undefined, mateId: undefined, offspringIds: [], paidPrice: 80, estimatedValue: 120, status: 'Sold', saleDetails: { date: '2024-06-10', price: 150, buyer: 'John Doe' }, imageUrl: '', medicalRecords: []
  },
  {
    id: '3', species: 'Cockatoo', subspecies: undefined, ringNumber: undefined, unbanded: true, category: 'Bird', sex: 'unsexed', birthDate: '2024-05-30', visualMutations: [], splitMutations: [], fatherId: '1', motherId: '4', mateId: undefined, offspringIds: [], paidPrice: 0, estimatedValue: 50, status: 'Hand-rearing', medicalRecords: []
  },
  {
    id: '4', species: 'Cockatoo', subspecies: 'Galah / Rose-breasted Cockatoo - Eolophus roseicapilla', ringNumber: 'C789', unbanded: false, category: 'Bird', sex: 'female', birthDate: '2022-03-20', visualMutations: ['Cinnamon'], splitMutations: [], fatherId: undefined, motherId: undefined, mateId: '1', offspringIds: ['3'], paidPrice: 160, estimatedValue: 220, status: 'Available', imageUrl: '', medicalRecords: []
  },
];

export const initialPairs: Pair[] = [
    { id: 'p1', category: 'Pair', maleId: '1', femaleId: '4' },
];

export const initialCages: Cage[] = [
    { id: 'c1', category: 'Cage', name: 'Breeding Cage A', birdIds: ['1', '4'], cost: 120 },
    { id: 'c2', category: 'Cage', name: 'Flight Cage 1', birdIds: ['2', '3'], cost: 250 },
];

export const initialBreedingRecords: BreedingRecord[] = [
    {
        id: 'br1',
        category: 'BreedingRecord',
        pairId: 'p1',
        startDate: '2024-05-01',
        eggs: [
            { id: 'e1', laidDate: '2024-05-10', expectedHatchDate: '2024-05-23', status: 'Hatched', hatchDate: '2024-05-30', chickId: '3' },
            { id: 'e2', laidDate: '2024-05-12', expectedHatchDate: '2024-05-25', status: 'Laid' },
            { id: 'e3', laidDate: '2024-05-14', expectedHatchDate: '2024-05-27', status: 'Infertile' },
        ],
        notes: 'First clutch of the season. Pair seems to be doing well.'
    }
];

export const initialNotes: NoteReminder[] = [
    {
        id: 'nr1',
        category: 'NoteReminder',
        title: 'Weekly Maintenance',
        content: 'Perform weekly checks on all birds and cages.',
        isReminder: true,
        reminderDate: new Date(new Date().setDate(new Date().getDate() + 1)).toISOString(),
        isRecurring: true,
        recurrencePattern: 'weekly',
        associatedBirdIds: [],
        subTasks: [
            { id: 'st1', text: 'Scrub perches for Breeding Cage A', completed: false, associatedBirdIds: ['1', '4'] },
            { id: 'st2', text: 'Replace substrate for all cages', completed: false, associatedBirdIds: ['1', '2', '3', '4'] },
            { id: 'st3', text: 'Check on African Grey', completed: true, associatedBirdIds: ['2'] },
        ],
        completed: false,
    },
    {
        id: 'nr2',
        category: 'NoteReminder',
        title: 'Order more seed mix',
        content: 'Get the usual 20kg bag.',
        isReminder: false,
        isRecurring: false,
        recurrencePattern: 'none',
        associatedBirdIds: [],
        subTasks: [],
        completed: true,
    }
]

export const initialTransactions: Transaction[] = [
    { id: 't1', category: 'Transaction', type: 'expense', date: '2024-04-15', description: 'Purchase of Cockatoo (A123)', amount: 150, relatedBirdId: '1' },
    { id: 't2', category: 'Transaction', type: 'expense', date: '2024-04-20', description: 'Purchase of African Grey Parrot (B456)', amount: 80, relatedBirdId: '2' },
    { id: 't3', category: 'Transaction', type: 'expense', date: '2024-05-05', description: 'Cage supplies', amount: 45.50 },
    { id: 't4', category: 'Transaction', type: 'income', date: '2024-05-18', description: 'Sale of surplus seed', amount: 25 },
    { id: 't5', category: 'Transaction', type: 'expense', date: '2024-06-01', description: 'Vet checkup for C789', amount: 60, relatedBirdId: '4' },
    { id: 't6', category: 'Transaction', type: 'income', date: '2024-06-10', description: 'Sale of African Grey Parrot (B456)', amount: 150, relatedBirdId: '2' }
];

export const initialPermits: Permit[] = [
    { id: 'p1', category: 'Permit', permitNumber: 'ZA-WC-12345', issuingAuthority: 'CapeNature', issueDate: '2024-01-01', expiryDate: '2025-01-01' },
    { id: 'p2', category: 'Permit', permitNumber: 'ZA-GP-67890', issuingAuthority: 'GDARD', issueDate: '2023-07-15' }
];

export const initialCustomMutations: CustomMutation[] = [
    { id: 'cm1', category: 'CustomMutation', name: 'Lutino', inheritance: 'Sex-Linked Recessive' },
    { id: 'cm2', category: 'CustomMutation', name: 'Cinnamon', inheritance: 'Sex-Linked Recessive' },
    { id: 'cm3', category: 'CustomMutation', name: 'Pied', inheritance: 'Autosomal Recessive' },
];


export const initialItems: CollectionItem[] = [
    ...initialBirds, 
    ...initialPairs, 
    ...initialCages, 
    ...initialBreedingRecords, 
    ...initialNotes, 
    ...initialTransactions, 
    ...initialPermits,
    ...initialCustomSpecies,
    ...initialCustomMutations,
];
