
'use client';

export const speciesData = {
  'Turdus migratorius': { name: 'American Robin', subspecies: ['T. m. migratorius', 'T. m. achrusterus'] },
  'Cyanocitta cristata': { name: 'Blue Jay', subspecies: ['C. c. cristata', 'C. c. bromia'] },
  'Cardinalis cardinalis': { name: 'Northern Cardinal', subspecies: ['C. c. cardinalis', 'C. c. floridanus'] },
  'Erithacus rubecula': { name: 'European Robin', subspecies: ['E. r. rubecula', 'E. r. melophilus'] },
  'Falco tinnunculus': { name: 'Common Kestrel', subspecies: [] },
  'Eolophus roseicapilla': { name: 'Galah', subspecies: ['E. r. roseicapilla', 'E. r. assimilis'] },
  'Serinus canaria domestica': { name: 'Domestic Canary', subspecies: [] },
};

export const mutationOptions = ['Opaline', 'Cinnamon', 'Lutino', 'Albino', 'Fallow', 'Spangle', 'Pied'] as const;

export type BirdFormValues = {
  species: string;
  subspecies?: string;
  sex: "male" | "female" | "unsexed";
  ringNumber?: string;
  unbanded: boolean;
  age?: number;
  cageId?: string;
  visualMutations: string[];
  splitMutations: string[];
  fatherId?: string;
  motherId?: string;
  mateId?: string;
  offspringIds: string[];
  paidPrice?: number;
  estimatedValue?: number;
};

export type Bird = Omit<BirdFormValues, 'cageId'> & { id: string, category: 'Bird' };

export type Cage = {
  id: string;
  name: string;
  category: 'Cage';
  birdIds: string[];
};

export type Pair = {
  id: string;
  category: 'Pair';
  maleId: string;
  femaleId: string;
};

export type Egg = {
  id: string;
  laidDate: string;
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
};

export type NoteReminder = {
    id: string;
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

export type CollectionItem = Bird | Cage | Pair | BreedingRecord | NoteReminder;

export const getBirdIdentifier = (bird: Bird) => {
    const identifier = bird.ringNumber ? `(${bird.ringNumber})` : '(Unbanded)';
    const speciesName = speciesData[bird.species as keyof typeof speciesData]?.name || bird.species;
    return `${speciesName} ${identifier}`;
};


export const initialBirds: Bird[] = [
  {
    id: '1', species: 'Turdus migratorius', subspecies: 'T. m. migratorius', ringNumber: 'A123', unbanded: false, category: 'Bird', sex: 'male', age: 2, visualMutations: ['Opaline'], splitMutations: ['Cinnamon', 'Pied'], fatherId: undefined, motherId: undefined, mateId: '4', offspringIds: ['3'], paidPrice: 150, estimatedValue: 200,
  },
  {
    id: '2', species: 'Cyanocitta cristata', subspecies: undefined, ringNumber: 'B456', unbanded: false, category: 'Bird', sex: 'female', age: 3, visualMutations: [], splitMutations: ['Lutino'], fatherId: undefined, motherId: undefined, mateId: undefined, offspringIds: [], paidPrice: 80, estimatedValue: 120,
  },
  {
    id: '3', species: 'Turdus migratorius', subspecies: undefined, ringNumber: undefined, unbanded: true, category: 'Bird', sex: 'unsexed', age: 1, visualMutations: [], splitMutations: [], fatherId: '1', motherId: '4', mateId: undefined, offspringIds: [], paidPrice: 0, estimatedValue: 50,
  },
  {
    id: '4', species: 'Turdus migratorius', subspecies: 'T. m. achrusterus', ringNumber: 'C789', unbanded: false, category: 'Bird', sex: 'female', age: 2, visualMutations: ['Cinnamon'], splitMutations: [], fatherId: undefined, motherId: undefined, mateId: '1', offspringIds: ['3'], paidPrice: 160, estimatedValue: 220,
  },
];

export const initialPairs: Pair[] = [
    { id: 'p1', category: 'Pair', maleId: '1', femaleId: '4' },
];

export const initialCages: Cage[] = [
    { id: 'c1', category: 'Cage', name: 'Breeding Cage A', birdIds: ['1', '4'] },
    { id: 'c2', category: 'Cage', name: 'Flight Cage 1', birdIds: ['2', '3'] },
];

export const initialBreedingRecords: BreedingRecord[] = [
    {
        id: 'br1',
        category: 'BreedingRecord',
        pairId: 'p1',
        startDate: '2024-05-01',
        eggs: [
            { id: 'e1', laidDate: '2024-05-10', status: 'Hatched', hatchDate: '2024-05-30', chickId: '3' },
            { id: 'e2', laidDate: '2024-05-12', status: 'Laid' },
            { id: 'e3', laidDate: '2024-05-14', status: 'Infertile' },
        ],
        notes: 'First clutch of the season. Pair seems to be doing well.'
    }
];

export const initialNotes: NoteReminder[] = [
    {
        id: 'nr1',
        category: 'NoteReminder',
        title: 'Clean cages',
        content: 'Deep clean all breeding and flight cages.',
        isReminder: true,
        reminderDate: new Date(new Date().setDate(new Date().getDate() + 1)).toISOString(),
        isRecurring: true,
        recurrencePattern: 'weekly',
        associatedBirdIds: ['1', '2', '3', '4'],
        subTasks: [
            { id: 'st1', text: 'Scrub perches', completed: false },
            { id: 'st2', text: 'Replace substrate', completed: false },
            { id: 'st3', text: 'Wash food and water bowls', completed: true },
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

export const initialItems: CollectionItem[] = [...initialBirds, ...initialPairs, ...initialCages, ...initialBreedingRecords, ...initialNotes];
