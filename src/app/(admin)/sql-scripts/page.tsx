
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function SqlScriptsPage() {
    const { toast } = useToast();

    const handleCopy = (text: string, name: string) => {
        navigator.clipboard.writeText(text);
        toast({
            title: "Copied to Clipboard",
            description: `${name} has been copied.`
        })
    }

    const resetDbSql = `
-- This script safely drops all existing application tables and then recreates them.
-- It's designed to be run in your Supabase SQL Editor to reset your database.

-- 1. Drop existing tables if they exist to ensure a clean slate.
DROP TABLE IF EXISTS "public"."custom_mutations";
DROP TABLE IF EXISTS "public"."custom_species";
DROP TABLE IF EXISTS "public"."permits";
DROP TABLE IF EXISTS "public"."transactions";
DROP TABLE IF EXISTS "public"."notes";
DROP TABLE IF EXISTS "public"."breeding_records";
DROP TABLE IF EXISTS "public"."pairs";
DROP TABLE IF EXISTS "public"."cages";
DROP TABLE IF EXISTS "public"."birds";
DROP TABLE IF EXISTS "public"."payfast_settings";
DROP TABLE IF EXISTS "public"."subscriptions";


-- 2. Create all application tables
CREATE TABLE IF NOT EXISTS birds (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL DEFAULT auth.uid(),
    category TEXT,
    species TEXT,
    subspecies TEXT,
    sex TEXT,
    ring_number TEXT,
    unbanded BOOLEAN,
    birth_date DATE,
    image_url TEXT,
    visual_mutations TEXT[],
    split_mutations TEXT[],
    father_id TEXT,
    mother_id TEXT,
    mate_id TEXT,
    offspring_ids TEXT[],
    paid_price NUMERIC,
    estimated_value NUMERIC,
    status TEXT,
    permit_id TEXT,
    sale_details JSONB,
    medical_records JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cages (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL DEFAULT auth.uid(),
    category TEXT,
    name TEXT,
    bird_ids TEXT[],
    cost NUMERIC,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pairs (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL DEFAULT auth.uid(),
    category TEXT,
    male_id TEXT,
    female_id TEXT,
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS breeding_records (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL DEFAULT auth.uid(),
    category TEXT,
    pair_id TEXT,
    start_date DATE,
    eggs JSONB,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notes (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL DEFAULT auth.uid(),
    category TEXT,
    title TEXT,
    content TEXT,
    is_reminder BOOLEAN,
    reminder_date DATE,
    is_recurring BOOLEAN,
    recurrence_pattern TEXT,
    associated_bird_ids TEXT[],
    sub_tasks JSONB,
    completed BOOLEAN,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL DEFAULT auth.uid(),
    category TEXT,
    type TEXT,
    date DATE,
    description TEXT,
    amount NUMERIC,
    related_bird_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS permits (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL DEFAULT auth.uid(),
    category TEXT,
    permit_number TEXT,
    issuing_authority TEXT,
    issue_date DATE,
    expiry_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS custom_species (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL DEFAULT auth.uid(),
    category TEXT,
    name TEXT UNIQUE,
    incubation_period INTEGER,
    subspecies TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS custom_mutations (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL DEFAULT auth.uid(),
    category TEXT,
    name TEXT,
    inheritance TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Enable Row Level Security (RLS) for all tables
ALTER TABLE birds ENABLE ROW LEVEL SECURITY;
ALTER TABLE cages ENABLE ROW LEVEL SECURITY;
ALTER TABLE pairs ENABLE ROW LEVEL SECURITY;
ALTER TABLE breeding_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE permits ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_species ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_mutations ENABLE ROW LEVEL SECURITY;


-- 4. Create RLS policies for all tables using the built-in auth.uid() function
-- This ensures that users can only access their own data.
CREATE POLICY "Users can manage their own birds" ON birds FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can manage their own cages" ON cages FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can manage their own pairs" ON pairs FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can manage their own breeding records" ON breeding_records FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can manage their own notes" ON notes FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can manage their own transactions" ON transactions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can manage their own permits" ON permits FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can manage their own custom species" ON custom_species FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can manage their own custom mutations" ON custom_mutations FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);


-- 5. Create Payfast Settings table and policies
CREATE TABLE IF NOT EXISTS payfast_settings (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id),
  merchant_id TEXT NOT NULL,
  merchant_key TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE payfast_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin can manage their own Payfast settings" ON payfast_settings
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 6. Create Subscriptions table and policies
CREATE TABLE IF NOT EXISTS subscriptions (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id),
    plan TEXT NOT NULL,
    status TEXT NOT NULL,
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ,
    payfast_payment_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own subscription" ON subscriptions
  FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY "Admin can view all subscriptions" ON subscriptions
  FOR SELECT
  USING (true); -- This is intentionally broad for the admin view.
`.trim();

    const seedDataSql = `
-- This script populates the 'custom_species' and 'custom_mutations' tables with initial data.
-- Run this AFTER you have run the main table creation script.
-- You must be logged in to the application for this to work, as it uses your user ID.

INSERT INTO "public"."custom_species" (id, user_id, category, name, incubation_period, subspecies) VALUES
('cs_initial_0', auth.uid(), 'CustomSpecies', 'Cockatoo', 26, ARRAY['Sulphur-crested Cockatoo - Cacatua galerita', 'Major Mitchell''s Cockatoo - Lophochroa leadbeateri', 'Galah / Rose-breasted Cockatoo - Eolophus roseicapilla', 'Cockatiel - Nymphicus hollandicus', 'Umbrella Cockatoo - Cacatua alba', 'Moluccan Cockatoo - Cacatua moluccensis']),
('cs_initial_1', auth.uid(), 'CustomSpecies', 'Macaw', 28, ARRAY['Blue-and-gold Macaw - Ara ararauna', 'Green-winged Macaw - Ara chloropterus', 'Scarlet Macaw - Ara macao', 'Hyacinth Macaw - Anodorhynchus hyacinthinus', 'Hahn''s Macaw - Diopsittaca nobilis nobilis', 'Severe Macaw - Ara severus']),
('cs_initial_2', auth.uid(), 'CustomSpecies', 'Conure', 24, ARRAY['Sun Conure - Aratinga solstitialis', 'Jenday Conure - Aratinga jandaya', 'Green-cheeked Conure - Pyrrhura molinae', 'Nanday Conure - Aratinga nenday', 'Blue-crowned Conure - Thectocercus acuticaudatus', 'Patagonian Conure - Cyanoliseus patagonus']),
('cs_initial_3', auth.uid(), 'CustomSpecies', 'African Grey Parrot', 28, ARRAY['Congo African Grey - Psittacus erithacus', 'Timneh African Grey - Psittacus timneh']),
('cs_initial_4', auth.uid(), 'CustomSpecies', 'Poicephalus', 26, ARRAY['Senegal Parrot - Poicephalus senegalus', 'Meyer''s Parrot - Poicephalus meyeri', 'Red-bellied Parrot - Poicephalus rufiventris', 'Cape Parrot - Poicephalus robustus']),
('cs_initial_5', auth.uid(), 'CustomSpecies', 'Lovebird', 23, ARRAY['Peach-faced Lovebird - Agapornis roseicollis', 'Fischer''s Lovebird - Agapornis fischeri', 'Masked Lovebird - Agapornis personatus', 'Nyasa Lovebird - Agapornis lilianae']),
('cs_initial_6', auth.uid(), 'CustomSpecies', 'Amazon Parrot', 27, ARRAY['Blue-fronted Amazon - Amazona aestiva', 'Yellow-naped Amazon - Amazona auropalliata', 'Double Yellow-headed Amazon - Amazona oratrix', 'Orange-winged Amazon - Amazona amazonica', 'Lilac-crowned Amazon - Amazona finschi']),
('cs_initial_7', auth.uid(), 'CustomSpecies', 'Lory & Lorikeet', 25, ARRAY['Rainbow Lorikeet - Trichoglossus moluccanus', 'Chattering Lory - Lorius garrulus', 'Black-capped Lory - Lorius lory', 'Red Lory - Eos bornea']),
('cs_initial_8', auth.uid(), 'CustomSpecies', 'Australian Parakeet', 18, ARRAY['Budgerigar - Melopsittacus undulatus', 'Eastern Rosella - Platycercus eximius', 'Princess Parrot - Polytelis alexandrae', 'Red-rumped Parrot - Psephotus haematonotus']),
('cs_initial_9', auth.uid(), 'CustomSpecies', 'Asiatic Parakeet', 23, ARRAY['Indian Ringneck Parakeet - Psittacula krameri manillensis', 'Alexandrine Parakeet - Psittacula eupatria', 'Plum-headed Parakeet - Psittacula cyanocephala', 'Moustached Parakeet - Psittacula alexandri']),
('cs_initial_10', auth.uid(), 'CustomSpecies', 'Eclectus Parrot', 28, ARRAY['Solomon Island Eclectus - Eclectus roratus solomonensis', 'Vosmaeri Eclectus - Eclectus roratus vosmaeri', 'Red-sided Eclectus - Eclectus roratus polychloros']),
('cs_initial_11', auth.uid(), 'CustomSpecies', 'Caique', 26, ARRAY['Black-headed Caique - Pionites melanocephalus', 'White-bellied Caique - Pionites leucogaster'])
ON CONFLICT (name) DO NOTHING;

INSERT INTO "public"."custom_mutations" (id, user_id, category, name, inheritance) VALUES
('cm1', auth.uid(), 'CustomMutation', 'Lutino', 'Sex-Linked Recessive'),
('cm2', auth.uid(), 'CustomMutation', 'Cinnamon', 'Sex-Linked Recessive'),
('cm3', auth.uid(), 'CustomMutation', 'Pied', 'Autosomal Recessive')
ON CONFLICT (id) DO NOTHING;
`.trim();

  const grantAdminSql = `
-- This script finds the user with the specified email and grants them admin privileges.
UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data || '{"subscription_status": "admin"}'
WHERE email = 'thecollector495@gmail.com';
`.trim();


  return (
    <div className="p-4 sm:p-6 md:p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold">SQL Scripts</h1>
        <p className="text-muted-foreground">Scripts for setting up and managing your Supabase database.</p>
      </div>

      <div className="space-y-8 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle>1. Reset Database Tables</CardTitle>
            <CardDescription>Run this script in your Supabase SQL Editor. It will completely delete all existing app tables and recreate them. This is useful for a clean start.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative">
                <pre className="bg-muted p-4 rounded-md overflow-x-auto text-xs">{resetDbSql}</pre>
                <Button size="icon" variant="ghost" className="absolute top-2 right-2" onClick={() => handleCopy(resetDbSql, 'Reset Script')}><Copy className="h-4 w-4"/></Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>2. Seed Initial Data</CardTitle>
            <CardDescription>After creating the tables, log into the application and then run this script to populate your database with the default species and mutations.</CardDescription>
          </CardHeader>
          <CardContent>
             <div className="relative">
                <pre className="bg-muted p-4 rounded-md overflow-x-auto text-xs">{seedDataSql}</pre>
                <Button size="icon" variant="ghost" className="absolute top-2 right-2" onClick={() => handleCopy(seedDataSql, 'Seed Data Script')}><Copy className="h-4 w-4"/></Button>
            </div>
          </CardContent>
        </Card>

         <Card>
          <CardHeader>
            <CardTitle>3. Grant Admin Privileges</CardTitle>
            <CardDescription>After signing up with the email 'thecollector495@gmail.com', run this script to grant that user admin access to the dashboard.</CardDescription>
          </CardHeader>
          <CardContent>
             <div className="relative">
                <pre className="bg-muted p-4 rounded-md overflow-x-auto text-xs">{grantAdminSql}</pre>
                <Button size="icon" variant="ghost" className="absolute top-2 right-2" onClick={() => handleCopy(grantAdminSql, 'Admin Script')}><Copy className="h-4 w-4"/></Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
