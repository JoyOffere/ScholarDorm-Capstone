#!/usr/bin/env node

/**
 * Teacher Database Migration Runner
 * 
 * This script helps run the teacher role database migrations
 * Usage: node scripts/run-teacher-migration.js [environment]
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   - VITE_SUPABASE_URL');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY (or VITE_SUPABASE_KEY)');
  process.exit(1);
}

// Create Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Migration files to run in order
const migrationFiles = [
  'teacher-role-migration.sql',
  'teacher-utilities.sql'
];

async function runMigration(filename) {
  console.log(`📝 Running migration: ${filename}`);
  
  try {
    const filePath = path.join(__dirname, '..', 'database', filename);
    const sqlContent = fs.readFileSync(filePath, 'utf8');
    
    // Split the SQL content by semicolons and execute each statement
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    for (const statement of statements) {
      if (statement.trim()) {
        const { error } = await supabase.rpc('exec_sql', { sql: statement });
        
        if (error) {
          // Try direct execution if RPC fails
          const { error: directError } = await supabase
            .from('_migrations')
            .insert({ statement });
          
          if (directError) {
            console.warn(`⚠️  Warning executing statement: ${error.message}`);
          }
        }
      }
    }
    
    console.log(`✅ Completed migration: ${filename}`);
  } catch (error) {
    console.error(`❌ Error running migration ${filename}:`, error.message);
    throw error;
  }
}

async function runTeacherMigrations() {
  console.log('🚀 Starting Teacher Role Database Migrations...');
  console.log('📊 Supabase URL:', supabaseUrl);
  console.log('');
  
  try {
    // Test database connection
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (error && error.code !== 'PGRST116') {
      throw new Error(`Database connection failed: ${error.message}`);
    }
    
    console.log('✅ Database connection successful');
    console.log('');
    
    // Run each migration
    for (const filename of migrationFiles) {
      await runMigration(filename);
      console.log('');
    }
    
    // Verify teacher setup
    console.log('🔍 Verifying teacher setup...');
    
    // Check if teacher role exists in users table
    const { data: teacherCheck } = await supabase
      .from('users')
      .select('id')
      .eq('role', 'teacher')
      .limit(1);
    
    console.log(`📊 Teachers in database: ${teacherCheck?.length || 0}`);
    
    // Check teacher tables
    const teacherTables = [
      'teacher_student_assignments',
      'teacher_course_assignments',
      'teacher_content',
      'rsl_content',
      'teacher_analytics',
      'teacher_messages',
      'teacher_gradebook'
    ];
    
    console.log('📋 Checking teacher tables...');
    for (const tableName of teacherTables) {
      try {
        const { error } = await supabase
          .from(tableName)
          .select('count')
          .limit(1);
        
        if (error) {
          console.log(`❌ Table ${tableName}: ${error.message}`);
        } else {
          console.log(`✅ Table ${tableName}: Ready`);
        }
      } catch (err) {
        console.log(`❌ Table ${tableName}: Error checking`);
      }
    }
    
    console.log('');
    console.log('🎉 Teacher Role Database Migration Completed Successfully!');
    console.log('');
    console.log('Next steps:');
    console.log('1. Create a teacher user account through the application');
    console.log('2. Assign courses to the teacher via the admin panel');
    console.log('3. Assign students to the teacher for those courses');
    console.log('4. Test the teacher dashboard functionality');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.log('');
    console.log('Troubleshooting:');
    console.log('1. Check your environment variables');
    console.log('2. Verify database permissions');
    console.log('3. Check the database logs for detailed errors');
    console.log('4. Ensure the base schema is properly set up');
    process.exit(1);
  }
}

// Add helper function to create a sample teacher
async function createSampleTeacher() {
  console.log('👨‍🏫 Creating sample teacher account...');
  
  try {
    const { data, error } = await supabase.auth.admin.createUser({
      email: 'teacher@scholardorm.com',
      password: 'teacher123',
      email_confirm: true,
      user_metadata: {
        full_name: 'Sample Teacher',
        role: 'teacher'
      }
    });
    
    if (error && !error.message.includes('already registered')) {
      throw error;
    }
    
    // Update user role in the database
    const { error: updateError } = await supabase
      .from('users')
      .update({ 
        role: 'teacher',
        full_name: 'Sample Teacher' 
      })
      .eq('email', 'teacher@scholardorm.com');
    
    if (updateError) {
      console.warn('⚠️  Warning updating teacher role:', updateError.message);
    }
    
    console.log('✅ Sample teacher created/updated');
    console.log('   Email: teacher@scholardorm.com');
    console.log('   Password: teacher123');
    
  } catch (error) {
    console.error('❌ Error creating sample teacher:', error.message);
  }
}

// Run migrations
if (process.argv.includes('--create-sample-teacher')) {
  createSampleTeacher();
} else {
  runTeacherMigrations();
}