import Product from "../models/Product.js";

/**
 * GET /api/products
 * Fetch paginated list of products
 * Query params: page (default=1), limit (default=20)
 */
export const getProducts = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, in_stock, category, sort } = req.query;

    const filters = {};

    if (search) {
      filters.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    if (in_stock === "true") filters.stock_quantity = { $gt: 0 };
    else if (in_stock === "false") filters.stock_quantity = { $lte: 0 };

    if (category && category !== "all") {
      // Assuming categories are stored as array of objects with slug field
      filters["categories.slug"] = category;
    }

    let sortOption = { createdAt: -1 }; // newest default

    if (sort === "price_asc") sortOption = { price: 1 };
    else if (sort === "price_desc") sortOption = { price: -1 };

    const skip = (page - 1) * limit;

    const total = await Product.countDocuments(filters);
    const products = await Product.find(filters)
      .sort(sortOption)
      .skip(skip)
      .limit(Number(limit));

    const totalPages = Math.ceil(total / limit);

    res.json({
      data: products,
      total,
      totalPages,
      currentPage: Number(page),
    });
  } catch (err) {
    console.error("Get products error:", err);
    res.status(500).json({ message: "Failed to fetch products" });
  }
};

/**
 * GET /api/products/:id
 * Fetch single product by wooId
 */
export const getProductById = async (req, res) => {
  try {
    const wooId = parseInt(req.params.id);
    if (isNaN(wooId))
      return res.status(400).json({ message: "Invalid product ID" });

    const product = await Product.findOne({ wooId }).lean();

    if (!product)
      return res.status(404).json({ message: "Product not found" });

    res.json(product);
  } catch (err) {
    console.error("Error fetching product:", err);
    res.status(500).json({ message: "Server error fetching product" });
  }
};

/**
 * GET /api/products/categories
 * Fetch distinct product categories (with slug and name)
 */
export const getCategories = async (req, res) => {
  try {
    // Get distinct category slugs from products
    const categories = await Product.aggregate([
      { $unwind: "$categories" }, // flatten categories array
      {
        $group: {
          _id: "$categories.slug",
          name: { $first: "$categories.name" },
          slug: { $first: "$categories.slug" },
        },
      },
      {
        $project: {
          _id: 0,
          slug: 1,
          name: 1,
        },
      },
      { $sort: { name: 1 } },
    ]);

    res.json({ data: categories });
  } catch (err) {
    console.error("Error fetching categories:", err);
    res.status(500).json({ message: "Failed to fetch categories" });
  }
};
