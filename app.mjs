import './config.mjs';
import express from 'express'
import session from 'express-session';
import path from 'path'
import bodyParser from 'body-parser'
import { fileURLToPath } from 'url';
import passport from './passport-setup.mjs';
import flash from 'express-flash';
import bcrypt from 'bcrypt';

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import { Domains, Managers, CanteenOwners, Students } from './db.mjs';


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Add session middleware
app.use(session({ secret: process.env.SECRET_KEY, resave: false, saveUninitialized: false }));

// Initialize Passport and restore authentication state, if any, from the session
app.use(passport.initialize());
app.use(passport.session());

app.use(flash());

// configure templating to hbs
app.set('view engine', 'hbs');


// Function to hash a password
const hashPassword = async (password) => {
    try {
        const salt = await bcrypt.genSalt(parseInt(process.env.SALT_ROUNDS));
        const hashedPassword = await bcrypt.hash(password, salt);
        return hashedPassword;
    } catch (error) {
        throw error;
    }
};

app.get('/', (req, res) => {
    res.send("Hello World");
});




// login routes

app.get('/login/:user', (req, res) => {
    res.render('login', { message: req.flash('error'), user: req.params.user }); // Flash message for error (if any)
});

// login route for admin
app.post('/login/admin', passport.authenticate('admin-local', {
    successRedirect: '/admin/listdomains',
    failureRedirect: '/login/admin',
    failureFlash: true,
}));

// login route for managers
app.post('/login/manager', (req, res, next) => {
    passport.authenticate('manager-local', (err, user, info) => {
        if (err) {
            return next(err);
        }
        if (!user) {
            // Handle authentication failure, e.g., redirect to login page
            return res.redirect('/login/manager');
        }

        // Set the redirect path dynamically based on the user's domain
        req.flash('error', info.message);
        const redirectPath = `/${user.domain.name}/manager/viewcanteenowners`;

        // Authenticate the user and redirect
        req.logIn(user, (err) => {
            if (err) { 
                return next(err);
            }
            return res.redirect(redirectPath);
        });
    })(req, res, next);
});


// Example login route for canteen owners
app.post('/login/canteenowner', (req, res, next) => {
    passport.authenticate('canteen-owner-local', (err, user, info) => {
        if (err) {
            return next(err);
        }
        if (!user) {
            // Handle authentication failure, e.g., redirect to login page
            req.flash('error', info.message);
            return res.redirect('/login/canteenowner');
        }

        // Set the redirect path dynamically based on the user's domain
        const redirectPath = `/${user.domain.name}/canteenowner/dashboard`;

        // Authenticate the user and redirect
        req.logIn(user, (err) => {
            if (err) {
                return next(err);
            }
            return res.redirect(redirectPath);
        });
    })(req, res, next);
});

// Example login route for students
app.post('/login/student', (req, res, next) => {
    passport.authenticate('student-local', (err, user, info) => {
        if (err) {
            return next(err);
        }
        if (!user) {
            // Handle authentication failure, e.g., redirect to login page
            req.flash('error', info.message);
            return res.redirect('/login/student');
        }

        // Set the redirect path dynamically based on the user's domain
        const redirectPath = `/${user.domain.name}/student/dashboards`;

        // Authenticate the user and redirect
        req.logIn(user, (err) => {
            if (err) {
                return next(err);
            }
            return res.redirect(redirectPath);
        });
    })(req, res, next);
});




// Example protected route
app.get('/:domain/:role/dashboards', (req, res) => {
    // Check if the user is authenticated
    if (req.isAuthenticated()) {
        // Render the dashboard for the authenticated user
        res.send(`Hello ${req.user.role}`);
    } else {
        // Redirect to the login page if not authenticated
        res.redirect('/login/student');
    }
});







// Routes for admin
app.get('/admin/createdomain', (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== 'admin') {
        return res.redirect('/login/admin');
    }
    res.render('admin', {createDomain: true});
});

app.post('/admin/createdomain', async (req, res) => {
    try {
      const { domainName, managerUsername, managerPassword } = req.body;
  
      // Check if the manager username is already in use
      // Check if the manager username is already in use
      const existingManager = await Managers.findOne({ username: managerUsername });
      if (existingManager) {
        // Render the page again with an error message
        return res.render('admin', { error: 'Manager username is already in use', createDomain: true });
      }
      // create the domain
      const domain = await Domains.create({ name: domainName.toLowerCase()});
      const hashed_password = await hashPassword(managerPassword);
      // Create the manager
      const manager = await Managers.create({
        username: managerUsername,
        hash: hashed_password,
        domain: domain._id,
      });
  
      res.redirect('/admin/listdomains');
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
  });


app.get('/admin/listdomains', async (req, res) => {
    try {
        if (!req.isAuthenticated() || req.user.role !== 'admin') {
            return res.redirect('/login/admin');
        }
        // Fetch data from your database
        const managers = await Managers.find().populate('domain');

        // Combine the data into a single object
        const adminData = {
            managers: managers.map(manager => ({
                domainName: manager.domain.name,
                managerUsername: manager.username,
            }))
        };

        // Render the admin page and pass the data object
        res.render('admin', { adminData, createDomain: false});
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});







// Routes for Managers
app.get('/:domain/manager/createcanteenowner', (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== 'manager') {
        return res.redirect('/login/manager');
    }
    res.render('manager', { createCanteenOwner: true, domain: req.params.domain });
});

app.post('/:domain/manager/createcanteenowner', async (req, res) => {
    try{
        const { canteenOwnerUsername, canteenOwnerPassword } = req.body;
        const hashed_password = await hashPassword(canteenOwnerPassword);
        const canteenOwner = await CanteenOwners.create({
            username: canteenOwnerUsername,
            hash: hashed_password,
            domain: req.user.domain._id,
        });
        res.redirect(`/${req.params.domain}/manager/viewcanteenowners`);
    }
    catch(error){
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

app.get('/:domain/manager/createstudent', (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== 'manager') {
        return res.redirect('/login/manager');
    }
    res.render('manager', { createStudent: true, domain: req.params.domain });
});

app.post('/:domain/manager/createstudent', async (req, res) => {
    try{
        const { studentUsername, studentPassword, studentName, studentBalance } = req.body;
        const hashed_password = await hashPassword(studentPassword);
        const student = await Students.create({
            username: studentUsername,
            hash: hashed_password,
            name: studentName,
            balance: studentBalance,
            domain: req.user.domain._id,
        });
        res.redirect(`/${req.params.domain}/manager/viewstudents`);
    }
    catch(error){
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

app.get('/:domain/manager/viewcanteenowners', async(req, res) => {
    try{
        if (!req.isAuthenticated() || req.user.role !== 'manager') {
            return res.redirect('/login/manager');
        }
        const canteenOwners = await CanteenOwners.find({domain: req.user.domain._id});
        res.render('manager', { viewCanteenOwners: true, canteenOwners, domain: req.params.domain });
    }
    catch(error){
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

app.get('/:domain/manager/viewstudents', async (req, res) => {
    try{
        if (!req.isAuthenticated() || req.user.role !== 'manager') {
            return res.redirect('/login/manager');
        }
        const students = await Students.find({domain: req.user.domain._id});
        res.render('manager', { viewStudents: true, students, domain: req.params.domain });
    }
    catch(error){
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});








// Routes for Canteen Owners

// Display canteen owner dashboard with inventory table
app.get('/:domain/canteenowner/dashboard', async (req, res) => {
    try {
        if (!req.isAuthenticated() || req.user.role !== 'canteenowner') {
            return res.redirect('/login/canteenowner');
        }

        // Fetch the canteen owner and populate the inventory
        //const canteenOwner = await CanteenOwners.findById(req.user._id).populate('inventory');
        res.render('canteenOwner', { inventory: req.user.inventory, domain: req.params.domain, display: true });
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

// Handle form submission for adding a new item to the inventory
app.post('/:domain/canteenowner/additem', async (req, res) => {
    try {
        const { itemName, itemPrice, itemQuantity } = req.body;

        // Find the canteen owner and add the new item to the inventory
        //const canteenOwner = await CanteenOwner.findById(req.user._id);
        req.user.inventory.push({ item: itemName, price: itemPrice, quantity: itemQuantity });
        await req.user.save();

        res.redirect(`/${req.params.domain}/canteenowner/dashboard`);
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

// Handle editing an existing item in the inventory
app.get('/:domain/canteenowner/edit/:itemId', async (req, res) => {
    try {
        if (!req.isAuthenticated() || req.user.role !== 'canteenowner') {
            return res.redirect('/login/canteenowner');
        }   
        // Fetch the canteen owner and the specific inventory item for editing
        //const canteenOwner = await CanteenOwner.findById(req.user._id);
        const selectedItem = req.user.inventory.find(item => item._id.toString() === req.params.itemId);

        if (!selectedItem) {
            return res.status(404).send('Item not found');
        }

        res.render('canteenOwner', { selectedItem, domain: req.params.domain, editItem: true });
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});


// Handle form submission for editing an item in the inventory
app.post('/:domain/canteenowner/edit/:itemId', async (req, res) => {
    try {
        const { itemName, itemPrice, itemQuantity } = req.body;

        // Find the canteen owner and the specific inventory item for editing
        //const canteenOwner = await CanteenOwner.findById(req.user._id);
        const selectedItem = req.user.inventory.find(item => item._id.toString() === req.params.itemId);

        if (!selectedItem) {
            return res.status(404).send('Item not found');
        }

        // Update the selected item
        selectedItem.item = itemName;
        selectedItem.price = itemPrice;
        selectedItem.quantity = itemQuantity;

        // Save the updated canteen owner
        await req.user.save();

        res.redirect(`/${req.params.domain}/canteenowner/dashboard`);
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});


// Handle deletion of an item from the inventory
app.get('/:domain/canteenowner/delete/:itemId', async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== 'canteenowner') {
        return res.redirect('/login/canteenowner');
    }
    try {
        // Find the canteen owner and remove the item from the inventory
        //const canteenOwner = await CanteenOwner.findById(req.user._id);

        // Filter out the item to be deleted
        req.user.inventory = req.user.inventory.filter(item => item._id.toString() !== req.params.itemId);

        // Save the updated canteen owner
        await req.user.save();

        res.redirect(`/${req.params.domain}/canteenowner/dashboard`);
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});



// Define the route for data insertion
app.get('/insert', async (req, res) => {
    try {
        // Sample Insert into Domain Collection
        const domain = await Domains.create({
            name: "school",
        });

        // Sample Insert into Manager Collection
        const managerPassword = await hashPassword("hashed_password");
        const manager = await Managers.create({
            username: "john_doe",
            hash: managerPassword,
            domain: domain._id,
        });

        // Sample Insert into Canteen Owner Collection
        const canteenOwnerPassword = await hashPassword("hashed_password");
        const canteenOwner = await CanteenOwners.create({
            username: "canteen_owner_1",
            hash: canteenOwnerPassword,
            revenue: 10000,
            inventory: [{ item:'apple',price:5,quantity:10},{ item:'banana',price:10,quantity:20}],
            domain: domain._id,
        });

        // Sample Insert into Student Collection
        const studentPassword = await hashPassword("hashed_password");
        const student = await Students.create({
            username: "student_1",
            name: "Student One",
            hash: studentPassword,
            balance: 50,
            domain: domain._id,
        });

        console.log('Documents inserted successfully');

        // Send a response
        res.send('Data inserted successfully!');
    } catch (error) {
        console.error('Error inserting data:', error);
        res.status(500).send('Internal Server Error');
    }
});



app.listen(process.env.PORT || 3000);
