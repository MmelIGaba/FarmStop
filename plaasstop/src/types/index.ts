import { AuthUser } from "aws-amplify/auth";

export interface Product {
  id: number;
  name: string;
  price: number;
  image: string;
  farmName: string;
  unit: string;
  category: string;
  subcategory: string;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface DbUser {
  id: string;
  email: string;
  name: string;
  role: 'buyer' | 'vendor' | 'admin';
}

export type CognitoUser = AuthUser;
