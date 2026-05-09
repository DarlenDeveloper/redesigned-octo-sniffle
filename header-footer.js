class SpecialHeader extends HTMLElement {
    connectedCallback() {
        this.innerHTML = `
        <nav class="hamburger-navigation">
    <div class="layer"></div>
    <!-- end layer -->
    <div class="container">
      <ul class="nav-menu mobile-menu">   
      </ul>
      <ul class="nav-menu">
        <li><a href="index.html">Home</a></li>
        <li><a href="quardo.html">PIXON REAL ESTATE</a></li>
        <li><a href="rooms.html">Apartments</a></li>
        <li><a href="contact-us.html">Contact Us</a></li>
      </ul>
      <div class="info-box"> <span>Follow us on Social Media</span>
        <ul class="nav-social">
            <li><a href="https://www.airbnb.gy/rooms/1400828857217786785?source_impression_id=p3_1749861386_P35yeBDZvjIPu0sr">Airbnb</a></li>
         <li><a href="https://www.tiktok.com/@pixonrealestate"><i class="fab fa-tiktok"></i></a></li>
          <li><a href="https://www.instagram.com/pixonrealestate"><i class="lni lni-instagram"></i></a></li>

        </ul>
      </div>
      <!-- end info-box --> 
    </div>
    <!-- end container --> 
  </nav>
  <!-- end hamburger-navigation -->
  <nav class="navbar">
    <div class="container">
      <div class="logo"> <a href="index.html"><img src="images/logobg.png" alt="Image" style="width:100px; height:100px;"></a> </div>
      <!-- end logo -->
      <div class="navbar-text">Booking 0752707989</div>
      <div class="navbar-text">Booking 0701654054</div>
      <div class="navbar-text">
  <a href="contact-us.html" style="color: inherit; text-decoration: none;">BOOK NOW</a>
</div>

      
      <!-- end navbar-text -->
      <!-- <div class="site-menu">
      <ul>
        <li><a href="quardo.html">PIXON REAL ESTATE</a></li> 
      </ul>
    </div> -->  
      <!-- end site-menu -->
      <div class="hamburger-menu">
        <button class="menu">
        <svg width="45" height="45" viewBox="0 0 100 100">
          <path class="line line1" d="M 20,29.000046 H 80.000231 C 80.000231,29.000046 94.498839,28.817352 94.532987,66.711331 94.543142,77.980673 90.966081,81.670246 85.259173,81.668997 79.552261,81.667751 75.000211,74.999942 75.000211,74.999942 L 25.000021,25.000058" />
          <path class="line line2" d="M 20,50 H 80"/>
          <path class="line line3" d="M 20,70.999954 H 80.000231 C 80.000231,70.999954 94.498839,71.182648 94.532987,33.288669 94.543142,22.019327 90.966081,18.329754 85.259173,18.331003 79.552261,18.332249 75.000211,25.000058 75.000211,25.000058 L 25.000021,74.999942" />
        </svg>
        </button>
      </div>
      <!-- end hamburger-menu --> 
    </div>
    <!-- end container --> 
  </nav>`;
    }
}

class SpecialFooter extends HTMLElement {
    connectedCallback() {
        this.innerHTML = `
        <footer class="footer">
    <div class="container">
      <div class="row">
        <div class="col-lg-4">
          <h6 class="widget-title">PIXON REAL ESTATE</h6>
          <p>Discover unparalleled luxury at PIXON REAL ESTATE in Kampala <u>Uganda</u> Nestled in premium locations, our exclusive properties blend historic charm with modern elegance.</p>
        </div>
        <!-- end col-4 -->
        <div class="col-xl-3 col-lg-1"> </div>
        <!-- end col-3 -->
        <div class="col-xl-3 col-lg-3">
          <h6 class="widget-title">Contact</h6>
          <p>info@pixonrealestate.com<br>
            +256-752-707989<br>
            +256-748-917389<br>
            +256-701-654054<br>
            <!--     <a href="https://www.google.com/maps/search/?api=1&amp;query=centurylink+field" data-fancybox="" data-width="640" data-height="360">Discover On Map</a></p> -->
            <a href="https://www.google.com/maps/search/?api=1&query=Plot+421+Kulambiro+Kisasi+Ring+Road+Kampala+Uganda" 
            data-fancybox="" 
            data-width="640" 
            data-height="360">
            Discover On Map
          </a>
          
        </div>
        <!-- end col-3 -->
        <div class="col-xl-2 col-lg-4">
          <h6 class="widget-title">Location</h6>
          <p> Kulambiro road, 
            Kulambiro, Kampala <br>
            Uganda </p>
        </div>
        <!-- end col-2 -->
        <div class="col-12">
          <div class="bottom-bar"> <span>© 2025 PIXON REAL ESTATE | Premium Properties</span>
            <ul class="footer-social">
              <li><a href="https://www.instagram.com/pixonrealestate">Instagram</a></li>
              <li><a href="https://www.tiktok.com/@pixonrealestate">Tiktok</a></li>
              <li><a href="https://www.airbnb.com/rooms/1389211820281182585?adults=1&search_mode=regular_search&check_in=2025-05-27&source_impression_id=p3_1746201430_P3kIo54nLdaeVEWG&previous_page_section_name=1000&federated_search_id=2bb78f7c-abc6-4c57-967d-e45079ed98f6&guests=1&modal=PHOTO_TOUR_SCROLLABLE">Airbnb</a></li>
            </ul>
            <!-- end footer-social --> 
          </div>
          <!-- end bottom-bar --> 
        </div>
        <!-- end col-12 --> 
      </div>
      <!-- end row --> 
    </div>
    <!-- end container --> 
  </footer>`;
    }
}


customElements.define('special-header', SpecialHeader);
customElements.define('special-footer', SpecialFooter);