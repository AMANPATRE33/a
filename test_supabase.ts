import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function check() {
  const { data, error } = await supabase.from('feedback').select('*').limit(1);
  if (error) {
    console.error("Error fetching feedback:", error);
  } else {
    console.log("Feedback row:", data);
  }

  // Also try inserting a test row to see what fails
  const { error: insertError } = await supabase.from('feedback').insert([{
    user_name: 'Test',
    user_email: 'test@upl',
    rating: 5,
    message: 'Test message',
    type: 'Test',
    created_at: new Date().toISOString()
  }]);
  
  if (insertError) {
    console.error("Insert error:", insertError.message);
  } else {
    console.log("Insert success!");
  }
}

check();
