#!/usr/bin/env node

/**
 * Email Configuration Test Script
 * Run this to verify your email setup is working correctly
 */

require('dotenv').config();
const nodemailer = require('nodemailer');

async function testEmailConfiguration() {
    console.log('🔧 Testing email configuration...\n');
    
    // Check environment variables
    const requiredVars = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'CONTACT_EMAIL'];
    const missingVars = requiredVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
        console.error('❌ Missing required environment variables:');
        missingVars.forEach(varName => console.error(`   - ${varName}`));
        console.error('\nPlease update your .env file with the missing variables.\n');
        process.exit(1);
    }
    
    console.log('✅ All required environment variables are set');
    console.log(`📧 SMTP Host: ${process.env.SMTP_HOST}`);
    console.log(`🔌 SMTP Port: ${process.env.SMTP_PORT}`);
    console.log(`👤 SMTP User: ${process.env.SMTP_USER}`);
    console.log(`📬 Contact Email: ${process.env.CONTACT_EMAIL}\n`);
    
    // Create transporter
    const transporter = nodemailer.createTransporter({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT),
        secure: process.env.SMTP_PORT === '465',
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        }
    });
    
    try {
        // Test connection
        console.log('🔍 Testing SMTP connection...');
        await transporter.verify();
        console.log('✅ SMTP connection successful!\n');
        
        // Send test email
        console.log('📤 Sending test email...');
        const testEmail = {
            from: process.env.SMTP_USER,
            to: process.env.CONTACT_EMAIL,
            subject: 'Email Configuration Test - The Obvious Company',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #2E5BBA;">Email Configuration Test</h2>
                    <p>Congratulations! Your email configuration is working correctly.</p>
                    <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <h3>Configuration Details:</h3>
                        <ul>
                            <li><strong>SMTP Host:</strong> ${process.env.SMTP_HOST}</li>
                            <li><strong>SMTP Port:</strong> ${process.env.SMTP_PORT}</li>
                            <li><strong>From Email:</strong> ${process.env.SMTP_USER}</li>
                            <li><strong>Test Time:</strong> ${new Date().toLocaleString()}</li>
                        </ul>
                    </div>
                    <p>Your website contact forms and newsletter signups are now ready to work!</p>
                    <hr style="margin: 30px 0;">
                    <p style="color: #666; font-size: 14px;">
                        This is an automated test email from The Obvious Company website.
                    </p>
                </div>
            `
        };
        
        const result = await transporter.sendMail(testEmail);
        console.log('✅ Test email sent successfully!');
        console.log(`📧 Message ID: ${result.messageId}`);
        console.log(`📬 Email sent to: ${process.env.CONTACT_EMAIL}\n`);
        
        console.log('🎉 Email configuration is complete and working!');
        console.log('Your website forms will now send emails properly.\n');
        
    } catch (error) {
        console.error('❌ Email configuration failed:');
        console.error(`   Error: ${error.message}\n`);
        
        // Provide helpful troubleshooting tips
        console.log('🔧 Troubleshooting tips:');
        if (error.message.includes('authentication')) {
            console.log('   - Check your SMTP_USER and SMTP_PASS credentials');
            console.log('   - For Gmail, make sure you\'re using an App Password, not your regular password');
            console.log('   - Ensure 2-Factor Authentication is enabled on Gmail');
        } else if (error.message.includes('connection')) {
            console.log('   - Check your SMTP_HOST and SMTP_PORT settings');
            console.log('   - Ensure your firewall allows outbound connections on the SMTP port');
            console.log('   - Try using port 465 (SSL) instead of 587 (TLS)');
        } else {
            console.log('   - Double-check all environment variables in your .env file');
            console.log('   - Make sure there are no extra spaces in your credentials');
        }
        console.log('');
        
        process.exit(1);
    }
}

// Run the test
testEmailConfiguration().catch(console.error);