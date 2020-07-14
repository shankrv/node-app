/* --- User Model --- */
const mongo = require('mongodb');
const mongoDB = require('../utils/db-conn').mongoDB;

const ObjectId = mongo.ObjectId;

class User {
  constructor(name, email, cart, id) {
    this.name = name;
    this.email = email;
    this.cart = cart;
    this._id = id;
  }

  save() {
    const db = mongoDB();
    return db.collection('users').insertOne(this)
      .then(msg => console.log('user-added'))
      .catch(err => { throw err });
  }

  addToCart(prod) {
    const usrCart = [...this.cart.items];

    // 1. prod exist in cart
    const index = usrCart.findIndex(p => {
      return p.prodId.toString() === prod._id.toString(); // strict-match
    });

    if (index >= 0) {
      usrCart[index].quantity += 1;
    } else {
      // 2. prod doesnt exist in cart - add
      usrCart.push({ prodId: ObjectId(prod._id), quantity: 1 });
    }

    // 3. update-cart
    const updCart = {
      items: usrCart
    };

    // 4. db : user-cart
    const db = mongoDB();
    return db.collection('users').updateOne(
      { _id: ObjectId(this._id) },
      { $set: { cart: updCart } }
    );
  }

  fetchCart() {
    const db = mongoDB();
    const prodIds = this.cart.items.map(i => i.prodId);
    return db.collection('products')
      .find({ _id: { $in: prodIds } }).toArray()
      .then(prods => prods.map(p => {
        return { ...p, quantity: this.cart.items.find(i => i.prodId.toString() === p._id.toString()).quantity }
      }))
      .catch(err => console.log(err));
  }

  deleteItem(id) {
    const updCart = { items: [...this.cart.items.filter(i => i.prodId.toString() !== id.toString())] };

    const db = mongoDB();
    return db.collection('users').updateOne(
      { _id: ObjectId(this._id) },
      { $set: { cart: updCart } }
    ).then(msg => console.log('removed-from-cart'))
      .catch(err => { throw err });
  }

  static findId(id) {
    const db = mongoDB();
    return db.collection('users').findOne({ _id: ObjectId(id) });
  }
}

module.exports = User;
