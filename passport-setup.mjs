import './config.mjs';
import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { Managers, CanteenOwners, Students } from './db.mjs'; // Replace with the correct file path
import bcrypt from 'bcrypt';

const comparePasswords = async (plainPassword, hashedPassword) => {
    try {
        const match = await bcrypt.compare(plainPassword, hashedPassword);
        return match;
    } catch (error) {
        throw error;
    }
};

// Serialize user to store in session
passport.serializeUser((user, done) => {
    done(null, user.id);
});

// Deserialize user from stored session
passport.deserializeUser(async (id, done) => {
    if (id.startsWith('admin-')) {
        // Extract admin username from the ID
        const adminUsername = id.replace('admin-', '');
        // Create a simplified admin object
        const admin = { id, username: adminUsername, role: 'admin' };
        return done(null, admin);
      }
    try {
        const manager = await Managers.findById(id);
        if (manager) {
            return done(null, { ...manager.toObject(), role: 'manager' });
        }

        const canteenOwner = await CanteenOwners.findById(id);
        if (canteenOwner) {
            return done(null, { ...canteenOwner.toObject(), role: 'canteen-owner' });
        }

        const student = await Students.findById(id);
        if (student) {
            return done(null, { ...student.toObject(), role: 'student' });
        }

        return done(null, false);
    } catch (err) {
        return done(err);
    }
});

// Local Strategy for Managers

passport.use('manager-local', new LocalStrategy(
    async (username, password, done) => {
        try {
            const manager = await Managers.findOne({ username: username });
            let match = false;
            if (manager)
                match = await comparePasswords(password, manager.hash);
            if (!manager || !match) {
                return done(null, false, { message: 'Invalid username or password' });
            }

            return done(null, { ...manager.toObject(), role: 'manager' });
        } catch (err) {
            return done(err);
        }
    }
));

// Local Strategy for Canteen Owners
passport.use('canteen-owner-local', new LocalStrategy(
    async (username, password, done) => {
        try {
            const canteenOwner = await CanteenOwners.findOne({ username: username });
            let match = false;
            if (canteenOwner)
                match = await comparePasswords(password, canteenOwner.hash);
            if (!canteenOwner || !(match)) {
                return done(null, false, { message: 'Invalid username or password' });
            }

            return done(null, { ...canteenOwner.toObject(), role: 'canteen-owner' });
        } catch (err) {
            return done(err);
        }
    }
));

// Local Strategy for Students
passport.use('student-local', new LocalStrategy(
    async (username, password, done) => {
        try {
            const student = await Students.findOne({ username: username });
            let match = false;
            if (student)
                match = await comparePasswords(password, student.hash);

            if (!student || !(match)) {
                return done(null, false, { message: 'Invalid username or password' });
            }

            return done(null, { ...student.toObject(), role: 'student' });
        } catch (err) {
            return done(err);
        }
    }
));

// Local Strategy for Admin
passport.use('admin-local', new LocalStrategy(
    async (username, password, done) => {
        try {
            // Check if the provided credentials match the admin credentials
            const adminUsername = process.env.ADMIN_USERNAME;
            const adminPassword = process.env.ADMIN_PASSWORD;
            const adminId = `admin-${adminUsername}`;
            if (username === adminUsername && password === adminPassword) {
                // Admin authentication successful
                return done(null, { id: adminId, username: adminUsername, role: 'admin' });
            } else {
                // Incorrect admin credentials
                return done(null, false, { message: 'Invalid admin credentials' });
            }
        } catch (error) {
            return done(error);
        }
    }
));

export default passport;