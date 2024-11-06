// React kütüphanesinden React'i içe aktarıyoruz
import React from 'react'; // React, bileşenleri oluşturmak için gereken ana kütüphane
import './Header.css'; // Header stil dosyasını içe aktarıyoruz


// Header bileşenini tanımlıyoruz
function Header({ account, onConnectWallet }) { // cüzdan adresi ve bağlantı işlevi prop olarak alıyoruz
    return (
        // Bileşenin ana kapsayıcısı olarak bir <header> etiketi kullanıyoruz
        <header className="header">
            {/* Sol kısımda logo ve site ismini içerir */}
            <div className="logo">
                {/* Logoyu temsil eden bir resim etiketi */}
                <img src={`${process.env.PUBLIC_URL}/lot-chain.png`} alt="Lot-chain Logo" />


                {/* Site ismi */}
                <span>LOT-CHAIN</span>
            </div>
            {/* Ortadaki menü linkleri */}
            <nav className="menu-links">
                <a href="#help">Help</a> {/* Yardım linki */}
                <a href="#ecosystem">Ecosystem</a> {/* Ekosistem linki */}
                <a href="#community">Community</a> {/* Topluluk linki */}
            </nav>
            {/* Cüzdan Bağla Butonu veya Cüzdan Adresi */}
            <button onClick={onConnectWallet} className="connect-wallet-button">
                {account ? `${account.slice(0, 4)}...${account.slice(-4)}` : "Cüzdan Bağla"}
            </button>
        </header>
    );
}

// Header bileşenini dışa aktarıyoruz ki diğer dosyalarda kullanılabilsin
export default Header;
