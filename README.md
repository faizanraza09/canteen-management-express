# Dhaba

## Overview
*(TODO: Dhaba is a comprehensive web application designed to streamline school canteen operations. It caters to the needs of school administrators, canteen owners, and students, providing a seamless experience for managing accounts, updating menus, and making purchases. The frontend will be built using the React library for a more responsive and dynamic user interface.)*

## Data Model

The application will be controlled by an admin whose credentials will be saved in a dotenv file. The application will have one collection called domains that will store Domains, Manager, Canteen Owners, and Students hierarchally.

- **Admin** can create and manage Manager accounts on different domains
- **Domains** each schools portal is served on a different domain and the data is stored by the domain
- **Manager** each school will have a manager who creates canteen owner and student accounts
- **Canteen Owners** can update menus and monitor revenue.
- **Students** can check balances, add items to their cart, and make purchases.

## An Example Domain:

```
{
  name: "University Canteen"
}
```

## An Example Manager

```
{
  username: "manager123",
  hash: "hashed_password",
  domain: ObjectId("5f8d39a65a5b1d1ddc8c65a1") // Replace with an actual ObjectId
}
```

## An Example Canteen Owner

```
{
  username: "canteenOwner456",
  hash: "hashed_password",
  revenue: 1000,
  inventory: [
    {
      item: "Snack",
      price: 2.5,
      quantity: 50
    },
    {
      item: "Drink",
      price: 1.5,
      quantity: 30
    }
  ],
  domain: ObjectId("5f8d39a65a5b1d1ddc8c65a1"),
  orders: [
    {
      student: mongoose.Types.ObjectId("60c7c4e1a8b15b001f8498c3"), // Replace with a valid ObjectId
      items: [
        { item: "Snack1", price: 2.5, quantity: 2 },
        { item: "Drink1", price: 1.5, quantity: 1 },
      ],
      total: 6.5,
    },
  ], 
}

```

## An Example Student

```
{
  username: "student789",
  name: "John Doe",
  hash: "hashed_password",
  balance: 50,
  domain: ObjectId("5f8d39a65a5b1d1ddc8c65a1") 
}
```



## Technology Stack

- Frontend: hbs
- Backend: Node.js and Express.js
- Database: MongoDB

## [Link to Commented First Draft Schema](db.mjs)

## Wireframes

/login - Allows users to login

![](wireframes/login.png)

/admin - Allows admin to make and handle manager accounts

![](wireframes/admin.png)

/{domain}/manager - Allows manager of that domain to make canteen owner and student accounts

![](wireframes/manager.png)

/{domain}/canteen_owner - Allows canteen owner of that domain to set up inventory and track orders

![](wireframes/canteen_owner.png)

/{domain}/{student_id} - Allows relevant student of that domain to add items to cart

![](wireframes/student.png)

/{domain}/{student_id}/cart - Allows relevant student of that domain to view their cart
![](wireframes/cart.png)

## Sitemap

![](wireframes/sitemap.png)

## User Stories

### Admin Stories:
- As an **Admin**, I want to be able to log in securely with my credentials.
- As an **Admin**, I want to create Manager accounts for different school domains.
- As an **Admin**, I want the ability to manage (create, update, delete) Manager accounts.

### Domain Stories:
- As a **Domain**, I want to have a dedicated portal served on a unique domain.
- As a **Domain**, I want to store data hierarchically, keeping staff and student information organized.

### Manager Stories:
- As a **Manager**, I want to log in securely with my credentials.
- As a **Manager**, I want to create Canteen Owner and Student accounts for my school domain.
- As a **Manager**, I want to manage (create, update, delete) Canteen Owner and Student accounts.

### Canteen Owner Stories:
- As a **Canteen Owner**, I want to log in securely with my credentials.
- As a **Canteen Owner**, I want to update menus to reflect the available items and their prices.
- As a **Canteen Owner**, I want to monitor my revenue and see the price list for items.

### Student Stories:
- As a **Student**, I want to log in securely with my credentials.
- As a **Student**, I want to check my account balance.
- As a **Student**, I want to add items to my cart for purchase.

## Research Topics
- (5 points) Implement Passport.js for authentication of all users
- (3 points) Use dotenv for configuration for database, admin login etc
- (2 points) Used bootstrap for styling

## [Link to Initial Main Project File](app.mjs)

## Annotations / References Used
- https://www.passportjs.org/docs/
- https://getbootstrap.com/