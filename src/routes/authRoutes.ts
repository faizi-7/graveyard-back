import { Router } from 'express'
import { getUser, grantUser, initiatePasswordReset, login, register, resetPassword, sendContactMail, upgradeToContributor, verifyEmail, verifyEmailToken, verifyPasswordToken,} from '../controllers/authController'
import { checkAuthBasic } from '../middleware/checkAuth'
import { upload } from '../services/uploadService'

const router= Router()

// User Auth
router.get('/user/:id', getUser)
router.get('/protected', checkAuthBasic, grantUser)


// 1. POST { username, email, password } FullRoute :  '/api/auth/register'
router.post('/register', upload.single('image'), register)

// 2. POST { email, password } '/api/auth/login'
router.post('/login', login)

// 3. PUT { fullname } FullRoute :  '/api/auth/upgrade'
router.put('/upgrade', checkAuthBasic, upload.single('image'), upgradeToContributor)

// Email Verification
// 1. POST { email } FullRoute :  '/api/auth/verifymail'
router.get('/verifymail', checkAuthBasic, verifyEmail);

// 2. GET (email token is in the query) FullRoute :  '/api/auth/verifymailtoken'
router.get('/verifymailtoken', verifyEmailToken);

// Password Reset
// 1. POST { email } FullRoute :  '/api/auth/startpassreset'
router.post('/startpassreset', initiatePasswordReset);

// 2. GET (email token is in the query) FullRoute :  '/api/auth/verifypasstoken'
router.get('/verifypasstoken', verifyPasswordToken);

// 3. POST { resetToken, newPassword } FullRoute :  '/api/auth/resetpassword'
router.post('/resetpassword', resetPassword);

// POST { name, email, message  } FullRoute :  '/api/auth/contact'
router.post('/contact', sendContactMail)
export default router