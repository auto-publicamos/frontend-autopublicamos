import { Component } from '@angular/core';
import { Appbar } from "./layout/appbar/appbar";
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-main',
  imports: [Appbar, RouterOutlet],
  templateUrl: './main.html',
  styleUrl: './main.css',
})
export class Main {

}
