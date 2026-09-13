import Category from '../models/Category.js';
import Product from '../models/Product.js';
import User from '../models/User.js';
import Cart from '../models/Cart.js';
import Wishlist from '../models/Wishlist.js';
import { categoriesData, productsDataRaw } from '../data/groceryCatalog.js';

export const seedDatabase = async () => {
  try {
    // 1. Seed Admin & Customer if not present
    let adminUser = await User.findOne({ email: 'admin@megabasket.com' });
    if (!adminUser) {
      adminUser = await User.create({
        name: 'MegaBasket Admin',
        email: 'admin@megabasket.com',
        password: 'Admin@123',
        phone: '+91 98765 43210',
        role: 'admin',
      });
      await Cart.create({ user: adminUser._id, items: [] });
      await Wishlist.create({ user: adminUser._id, products: [] });
      console.log('Seeded Admin Account: admin@megabasket.com / Admin@123');
    }

    let customerUser = await User.findOne({ email: 'customer@megabasket.com' });
    if (!customerUser) {
      customerUser = await User.create({
        name: 'Sikandar Swami',
        email: 'customer@megabasket.com',
        password: 'Customer@123',
        phone: '+91 98765 12345',
        role: 'user',
      });
      await Cart.create({ user: customerUser._id, items: [] });
      await Wishlist.create({ user: customerUser._id, products: [] });
      console.log('Seeded Customer Account: customer@megabasket.com / Customer@123');
    }

    // 2. Upsert all 15 Categories by slug to avoid duplicates
    console.log(`Syncing ${categoriesData.length} grocery categories...`);
    const categoryMap = {};

    for (const catData of categoriesData) {
      let category = await Category.findOne({ slug: catData.slug });
      if (!category) {
        category = await Category.create(catData);
      } else {
        category.name = catData.name;
        category.description = catData.description;
        category.image = catData.image;
        await category.save();
      }
      categoryMap[catData.slug] = category._id;
    }

    // Also support any legacy category slugs if needed
    const allExistingCats = await Category.find();
    for (const cat of allExistingCats) {
      if (!categoryMap[cat.slug]) {
        categoryMap[cat.slug] = cat._id;
      }
    }

    // 3. Upsert all products by unique slug to prevent duplicates
    console.log(`Syncing ${productsDataRaw.length} realistic grocery products...`);
    let insertedCount = 0;
    let updatedCount = 0;

    for (const prodData of productsDataRaw) {
      const categoryId = categoryMap[prodData.categorySlug];
      if (!categoryId) {
        console.warn(`Category slug not found: ${prodData.categorySlug} for product ${prodData.name}`);
        continue;
      }

      const productPayload = {
        name: prodData.name,
        slug: prodData.slug,
        description: prodData.description,
        price: prodData.price,
        originalPrice: prodData.originalPrice,
        unit: prodData.unit || '1 kg',
        category: categoryId,
        brand: prodData.brand || 'MegaBasket Fresh',
        images: prodData.images,
        stock: prodData.stock,
        sku: `MB-${Math.floor(100000 + Math.random() * 900000)}`,
        specifications: prodData.specifications || [],
        rating: prodData.rating || 4.5,
        numReviews: prodData.numReviews || 12,
        isFeatured: Boolean(prodData.isFeatured),
        isActive: true,
      };

      const existingProduct = await Product.findOne({ slug: prodData.slug });
      if (!existingProduct) {
        await Product.create(productPayload);
        insertedCount++;
      } else {
        // Update fields to keep catalog fresh and accurate
        existingProduct.name = productPayload.name;
        existingProduct.description = productPayload.description;
        existingProduct.price = productPayload.price;
        existingProduct.originalPrice = productPayload.originalPrice;
        existingProduct.unit = productPayload.unit;
        existingProduct.category = categoryId;
        existingProduct.brand = productPayload.brand;
        existingProduct.images = productPayload.images;
        existingProduct.stock = productPayload.stock;
        existingProduct.specifications = productPayload.specifications;
        existingProduct.rating = productPayload.rating;
        existingProduct.numReviews = productPayload.numReviews;
        existingProduct.isFeatured = productPayload.isFeatured;
        existingProduct.isActive = true;
        await existingProduct.save();
        updatedCount++;
      }
    }

    console.log(
      `Database seeded successfully! Total products in catalog: ${await Product.countDocuments()} (New: ${insertedCount}, Updated: ${updatedCount})`
    );
  } catch (error) {
    console.error('Error seeding database:', error);
  }
};
