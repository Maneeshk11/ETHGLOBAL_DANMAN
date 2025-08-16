"use client";

export function ShopDetails() {
  return (
    <div id="shop-details" className="space-y-4">
      <h3 className="text-lg font-semibold mb-4">Shop Details</h3>
      <div className="grid gap-6">
        <div className="grid gap-2">
          <label
            htmlFor="category"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Shop Category
          </label>
          <select
            id="category"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="">Select category</option>
            <option value="food">Food & Beverage</option>
            <option value="clothing">Clothing & Fashion</option>
            <option value="electronics">Electronics</option>
            <option value="beauty">Beauty & Personal Care</option>
            <option value="home">Home & Garden</option>
            <option value="sports">Sports & Recreation</option>
            <option value="books">Books & Media</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div className="grid gap-2">
          <label
            htmlFor="address"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Shop Address
          </label>
          <textarea
            id="address"
            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            placeholder="Enter your shop's physical address"
          />
        </div>
        <div className="grid gap-2">
          <label
            htmlFor="phone"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Phone Number
          </label>
          <input
            type="tel"
            id="phone"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            placeholder="Enter your shop's phone number"
          />
        </div>
      </div>
    </div>
  );
}
