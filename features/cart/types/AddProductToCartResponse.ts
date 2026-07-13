export type AddProductToCartResponse = {
  status: string;
  message: string;
  data: {
    item: {
      id: number;
      productvariantid: number;
      quantity: number;
    };
  };
};
