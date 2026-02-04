import { Routes } from '@angular/router';
import { UpdatePassword } from './auth/update-password/update-password';

export const routes: Routes = [
	{
		path: '',
		component: UpdatePassword
	},
	{
		path: '**',
		redirectTo: ''
	}
];
