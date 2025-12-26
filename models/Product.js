import mongoose from "mongoose";

const dimensionSchema = new mongoose.Schema({
  length: { type: String, default: "" },
  width: { type: String, default: "" },
  height: { type: String, default: "" },
});

const imageSchema = new mongoose.Schema({
  id: Number,
  date_created: Date,
  date_modified: Date,
  src: String,
  name: String,
  alt: String,
  thumbnail: String,
});

const attributeSchema = new mongoose.Schema({
  id: Number,
  name: String,
  slug: String,
  position: Number,
  visible: Boolean,
  variation: Boolean,
  options: [String],
});

const metaDataSchema = new mongoose.Schema({
  id: Number,
  key: String,
  value: mongoose.Schema.Types.Mixed,
});

const storeSchema = new mongoose.Schema({
  id: Number,
  name: String,
  shop_name: String,
  url: String,
  address: [String],  // Not sure exact shape, keeping as array of strings
  avatar: String,
  banner: String,
});

const productSchema = new mongoose.Schema({
  wooId: { type: Number, unique: true }, // WooCommerce product ID
  name: String,
  slug: String,
  permalink: String,
  date_created: Date,
  date_modified: Date,
  type: String,
  status: String,
  featured: Boolean,
  catalog_visibility: String,
  description: String,
  short_description: String,
  sku: String,
  price: String,
  regular_price: String,
  sale_price: String,
  on_sale: Boolean,
  purchasable: Boolean,
  total_sales: Number,
  virtual: Boolean,
  downloadable: Boolean,
  downloads: [mongoose.Schema.Types.Mixed], // Array, shape varies
  download_limit: Number,
  download_expiry: Number,
  external_url: String,
  button_text: String,
  tax_status: String,
  tax_class: String,
  manage_stock: Boolean,
  stock_quantity: Number,
  backorders: String,
  backorders_allowed: Boolean,
  backordered: Boolean,
  low_stock_amount: Number,
  sold_individually: Boolean,
  weight: String,
  dimensions: dimensionSchema,
  shipping_required: Boolean,
  shipping_taxable: Boolean,
  shipping_class: String,
  shipping_class_id: Number,
  reviews_allowed: Boolean,
  average_rating: String,
  rating_count: Number,
  upsell_ids: [Number],
  cross_sell_ids: [Number],
  parent_id: Number,
  purchase_note: String,
  categories: [
    {
      id: Number,
      name: String,
      slug: String,
    },
  ],
  brands: [mongoose.Schema.Types.Mixed], // as in your example empty array
  tags: [mongoose.Schema.Types.Mixed],
  images: [imageSchema],
  attributes: [attributeSchema],
  default_attributes: [mongoose.Schema.Types.Mixed],
  variations: [Number],
  grouped_products: [mongoose.Schema.Types.Mixed],
  menu_order: Number,
  price_html: String,
  related_ids: [Number],
  meta_data: [metaDataSchema],
  stock_status: String,
  has_options: Boolean,
  post_password: String,
  global_unique_id: String,
  dokan_rma_settings: mongoose.Schema.Types.Mixed,
  store: storeSchema,
}, {
  timestamps: true,
});

const Product = mongoose.model("Product", productSchema);

export default Product;
