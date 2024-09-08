import { Router } from 'express'
import { initiatePasswordReset, login, register, resetPassword, upgradeToContributor, verifyEmail, verifyEmailToken, verifyPasswordToken,} from '../controllers/authController'
import { checkAuthBasic } from '../middleware/checkAuth'

const router= Router()

// User Auth
// 1. POST { username, email, password }
router.post('/register', register)
// 2. POST { email, password }
router.post('/login', login)
// 3. PUT { fullname, socialAccounts}
router.put('/upgrade', checkAuthBasic, upgradeToContributor)
// Email Verification
// 1. POST { email } 
router.post('/verifymail', verifyEmail);
// 2. GET (email token is in the query)
router.get('/verifymailtoken', verifyEmailToken);

// Password Reset
// 1. POST { email }
router.post('/startpassreset', initiatePasswordReset);
// 2. GET (email token is in the query)
router.get('/verifypasstoken', verifyPasswordToken);
// 1. POST { resetToken, newPassword }
router.post('/resetpassword', resetPassword);
export default router