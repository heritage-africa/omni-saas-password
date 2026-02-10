import { Routes } from '@angular/router';
import { UpdatePassword } from './auth/update-password/update-password';
import { ResetPassword } from './auth/reset-password/reset-password';
import { ForgotPassword } from './auth/forgot-password/forgot-password';

export const routes: Routes = [
	{
		path: '',
		component: UpdatePassword
	},
  {
    path: 'auth/forgot-password',
    component: ForgotPassword },
  {
    path: 'auth/reset-password',
    component: ResetPassword },
	{
		path: '**',
		redirectTo: ''
	}
];
