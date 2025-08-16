"use client";

export function TokenConfiguration() {
  return (
    <div id="token-setup" className="space-y-4">
      <h3 className="text-lg font-semibold mb-4">Token Configuration</h3>
      <div className="grid gap-6">
        <div className="grid gap-2">
          <label
            htmlFor="tokenName"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Token Name
          </label>
          <input
            type="text"
            id="tokenName"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            placeholder="e.g., JoeCoffee Token"
          />
        </div>
        <div className="grid gap-2">
          <label
            htmlFor="tokenSymbol"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Token Symbol
          </label>
          <input
            type="text"
            id="tokenSymbol"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            placeholder="e.g., JCT (3-5 characters)"
            maxLength={5}
          />
        </div>
        <div className="grid gap-2">
          <label
            htmlFor="initialSupply"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Initial Token Supply
          </label>
          <input
            type="number"
            id="initialSupply"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            placeholder="e.g., 10000"
            min="1"
          />
        </div>
        <div className="grid gap-2">
          <label
            htmlFor="tokenValue"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Token Value (USD)
          </label>
          <input
            type="number"
            id="tokenValue"
            step="0.01"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            placeholder="e.g., 1.00"
            min="0.01"
          />
        </div>
      </div>
    </div>
  );
}
