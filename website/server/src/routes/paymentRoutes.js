const express = require('express');
const { body, validationResult } = require('express-validator');
const crypto = require('crypto');
const router = express.Router();

// In-memory storage for demo (use database in production)
const paymentVerifications = new Map();
const accessTokens = new Map();

/**
 * Verify M-Pesa payment and generate access token
 */
router.post('/verify-payment', [
    body('fullName')
        .trim()
        .isLength({ min: 2 })
        .withMessage('Full name is required'),
    body('phoneNumber')
        .matches(/^254[0-9]{9}$/)
        .withMessage('Valid Kenyan phone number required (254XXXXXXXXX)'),
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Valid email address required'),
    body('mpesaCode')
        .matches(/^[A-Z0-9]{10}$/)
        .withMessage('Valid M-Pesa transaction code required (10 characters)'),
    body('termsAccepted')
        .equals('true')
        .withMessage('Terms and conditions must be accepted')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const { fullName, phoneNumber, email, organization, mpesaCode } = req.body;

        // Check if M-Pesa code has already been used
        if (paymentVerifications.has(mpesaCode)) {
            return res.status(400).json({
                success: false,
                message: 'This M-Pesa transaction code has already been used'
            });
        }

        // In production, integrate with M-Pesa API to verify transaction
        // For demo purposes, we'll simulate verification
        const isValidTransaction = await simulateMpesaVerification(mpesaCode, phoneNumber);

        if (!isValidTransaction) {
            return res.status(400).json({
                success: false,
                message: 'Payment verification failed. Please check your M-Pesa code and try again.'
            });
        }

        // Generate access token
        const accessToken = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        // Store payment verification
        paymentVerifications.set(mpesaCode, {
            fullName,
            phoneNumber,
            email,
            organization,
            verifiedAt: new Date(),
            accessToken
        });

        // Store access token
        accessTokens.set(accessToken, {
            fullName,
            email,
            phoneNumber,
            organization,
            mpesaCode,
            createdAt: new Date(),
            expiresAt,
            used: false
        });

        // Log successful payment verification
        console.log(`Payment verified for ${email} - M-Pesa: ${mpesaCode}`);

        // Send confirmation email (implement email service)
        await sendConfirmationEmail(email, fullName, accessToken);

        res.json({
            success: true,
            verified: true,
            accessToken,
            message: 'Payment verified successfully. You can now access the premium assessment.'
        });

    } catch (error) {
        console.error('Payment verification error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error during payment verification'
        });
    }
});

/**
 * Validate access token for premium assessment
 */
router.get('/validate-token/:token', async (req, res) => {
    try {
        const { token } = req.params;
        const tokenData = accessTokens.get(token);

        if (!tokenData) {
            return res.status(404).json({
                success: false,
                message: 'Invalid access token'
            });
        }

        if (new Date() > tokenData.expiresAt) {
            accessTokens.delete(token);
            return res.status(401).json({
                success: false,
                message: 'Access token has expired'
            });
        }

        res.json({
            success: true,
            valid: true,
            user: {
                fullName: tokenData.fullName,
                email: tokenData.email,
                organization: tokenData.organization
            }
        });

    } catch (error) {
        console.error('Token validation error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error during token validation'
        });
    }
});

/**
 * Mark access token as used after assessment completion
 */
router.post('/complete-assessment', [
    body('accessToken')
        .isLength({ min: 32 })
        .withMessage('Valid access token required'),
    body('assessmentResults')
        .isObject()
        .withMessage('Assessment results required')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const { accessToken, assessmentResults } = req.body;
        const tokenData = accessTokens.get(accessToken);

        if (!tokenData) {
            return res.status(404).json({
                success: false,
                message: 'Invalid access token'
            });
        }

        if (tokenData.used) {
            return res.status(400).json({
                success: false,
                message: 'This access token has already been used'
            });
        }

        // Mark token as used
        tokenData.used = true;
        tokenData.completedAt = new Date();
        tokenData.assessmentResults = assessmentResults;

        // Store assessment results (implement database storage)
        await storeAssessmentResults(tokenData, assessmentResults);

        // Send results email
        await sendAssessmentResultsEmail(tokenData.email, tokenData.fullName, assessmentResults);

        res.json({
            success: true,
            message: 'Assessment completed successfully'
        });

    } catch (error) {
        console.error('Assessment completion error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error during assessment completion'
        });
    }
});

/**
 * Simulate M-Pesa payment verification
 * In production, integrate with actual M-Pesa API
 */
async function simulateMpesaVerification(mpesaCode, phoneNumber) {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // For demo purposes, accept codes that follow the pattern
    // In production, make actual API call to M-Pesa
    const isValidFormat = /^[A-Z0-9]{10}$/.test(mpesaCode);
    const isValidPhone = /^254[0-9]{9}$/.test(phoneNumber);
    
    // Simulate 95% success rate for valid formats
    return isValidFormat && isValidPhone && Math.random() > 0.05;
}

/**
 * Send confirmation email after payment verification
 */
async function sendConfirmationEmail(email, fullName, accessToken) {
    // Implement email service integration
    console.log(`Sending confirmation email to ${email} for ${fullName}`);
    console.log(`Access token: ${accessToken}`);
    
    // In production, use nodemailer or similar service
    // const emailContent = {
    //     to: email,
    //     subject: 'Premium Assessment Access Confirmed',
    //     html: generateConfirmationEmailHTML(fullName, accessToken)
    // };
    // await emailService.send(emailContent);
}

/**
 * Store assessment results in database
 */
async function storeAssessmentResults(tokenData, assessmentResults) {
    // Implement database storage
    console.log(`Storing assessment results for ${tokenData.email}`);
    console.log('Results:', JSON.stringify(assessmentResults, null, 2));
    
    // In production, store in database
    // await db.assessmentResults.create({
    //     email: tokenData.email,
    //     fullName: tokenData.fullName,
    //     phoneNumber: tokenData.phoneNumber,
    //     organization: tokenData.organization,
    //     mpesaCode: tokenData.mpesaCode,
    //     results: assessmentResults,
    //     completedAt: new Date()
    // });
}

/**
 * Send assessment results email
 */
async function sendAssessmentResultsEmail(email, fullName, assessmentResults) {
    // Implement email service integration
    console.log(`Sending assessment results to ${email} for ${fullName}`);
    
    // In production, generate comprehensive results email
    // const emailContent = {
    //     to: email,
    //     subject: 'Your Strategic Intelligence Assessment Results',
    //     html: generateResultsEmailHTML(fullName, assessmentResults)
    // };
    // await emailService.send(emailContent);
}

module.exports = router;