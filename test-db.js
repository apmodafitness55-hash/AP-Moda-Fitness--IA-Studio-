import { createClient } from '@supabase/supabase-js';

const url1 = 'https://ckrwmdaocoyigpmzpdyz.supabase.co';
const key1 = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNrcndtZGFvY295aWdwbXpwZHl6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE1NDk2NzMsImV4cCI6MjA5NzEyNTY3M30.20vJ4pjavzl06v1dOIbx9rkxf7kc_72ApGgD6jCRiss';

const url2 = 'https://xkbryirdcjgjrrqnvmme.supabase.co';
const key2 = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhrYnJ5aXJkY2pnanJqcnFudm1lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA2Nzk0MDgsImV4cCI6MjA5NjI1NTQwOH0.DeWntFUq4jkKK38vsAxC-I8tzKN_l8GK5OqmgfoT7MI';

async function test() {
  console.log('Testing Database 1 (ckrwmdaocoyigpmzpdyz):');
  try {
    const supabase1 = createClient(url1, key1);
    const { data, error } = await supabase1.from('ap_products').select('count');
    if (error) {
      console.log('DB1 Error:', error.message);
    } else {
      console.log('DB1 Success, products count:', data);
    }
  } catch (err) {
    console.log('DB1 Exception:', err.message);
  }

  console.log('\nTesting Database 2 (xkbryirdcjgjrjrqnvme):');
  try {
    const supabase2 = createClient(url2, key2);
    const { data, error } = await supabase2.from('ap_products').select('count');
    if (error) {
      console.log('DB2 Error:', error.message);
    } else {
      console.log('DB2 Success, products count:', data);
    }
  } catch (err) {
    console.log('DB2 Exception:', err.message);
  }
}

test();
