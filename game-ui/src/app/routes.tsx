import { createBrowserRouter } from 'react-router-dom';
import { LoginPage, Rating, Table, TableList } from './../pages';

export const appRouter = createBrowserRouter([
  {
    path: '/',
    Component: TableList
  },
  {
    path: '/login',
    Component: LoginPage
  },
  {
    path: '/tables/:id',
    Component: Table
  },
  {
    path: '/rating',
    Component: Rating
  }
]);
