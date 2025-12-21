"use client";

import { useState } from "react";
import { useCart } from "@/lib/CartContext";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import CartDrawer from "@/app/components/CartDrawer";
import { ShoppingCart, Plus } from "lucide-react";

// Sample products for demonstration
const sampleProducts = [
  {
    id: "1",
    name: "Premium Widget",
    description: "High-quality widget for all your needs",
    price: 29.99,
    image: "/placeholder.svg",
  },
  {
    id: "2",
    name: "Deluxe Gadget",
    description: "Advanced gadget with cutting-edge features",
    price: 49.99,
    image: "/placeholder.svg",
  },
  {
    id: "3",
    name: "Basic Tool",
    description: "Essential tool for everyday use",
    price: 19.99,
    image: "/placeholder.svg",
  },
  {
    id: "4",
    name: "Pro Package",
    description: "Complete solution with all accessories",
    price: 89.99,
    image: "/placeholder.svg",
  },
];

export default function ShopPage() {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const { addToCart, itemCount } = useCart();

  const handleAddToCart = (product: typeof sampleProducts[0]) => {
    addToCart({
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      quantity: 1,
      image: product.image,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Shop</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                onClick={() => setIsCartOpen(true)}
                className="relative"
              >
                <ShoppingCart className="w-5 h-5 mr-2" />
                Cart
                {itemCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {itemCount}
                  </span>
                )}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Our Products</h2>
          <p className="mt-4 text-gray-600">
            Discover our collection of premium products
          </p>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {sampleProducts.map((product) => (
            <Card key={product.id} className="group hover:shadow-lg transition-shadow">
              <CardHeader className="p-0">
                <div className="aspect-square relative overflow-hidden rounded-t-lg bg-gray-100">
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <div className="text-4xl">📦</div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <CardTitle className="text-lg mb-2">{product.name}</CardTitle>
                <CardDescription className="text-sm mb-4">
                  {product.description}
                </CardDescription>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-gray-900">
                    ${product.price}
                  </span>
                  <Button
                    onClick={() => handleAddToCart(product)}
                    className="group-hover:bg-blue-600 group-hover:text-white transition-colors"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add to Cart
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State Alternative */}
        <div className="mt-12 text-center">
          <div className="bg-white rounded-lg shadow p-8">
            <div className="text-6xl mb-4">🛍️</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Build Your E-commerce Store
            </h3>
            <p className="text-gray-600 mb-6">
              This is a starter template. Replace the sample products with your own
              product catalog and connect to your preferred e-commerce platform.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Button variant="outline">
                Connect Stripe
              </Button>
              <Button variant="outline">
                Add Products
              </Button>
              <Button variant="outline">
                Customize Theme
              </Button>
            </div>
          </div>
        </div>
      </main>

      {/* Cart Drawer */}
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </div>
  );
}
