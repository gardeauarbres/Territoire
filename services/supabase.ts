
// Note: Ces variables devront être configurées dans l'environnement Vercel/Local
// Pour la démo, on simule le client si les clés sont absentes, 
// mais la structure est prête pour le mode "Production".

export const supabaseConfig = {
  url: 'https://votre-projet.supabase.co',
  anonKey: 'votre-cle-anonyme'
};

// En production réelle, on importerait { createClient } from '@supabase/supabase-js'
// Ici, on prépare la structure de données attendue par le reste de l'app.
export interface UserSession {
  user: {
    id: string;
    email: string;
    user_metadata: {
      username: string;
    };
  } | null;
}
