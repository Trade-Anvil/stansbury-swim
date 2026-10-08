import styles from './page.module.css'
import Nav from '../components/nav'
import Header from '../components/header'
import ParentTot from '../components/parent-tot'
import Photos from '../components/photos'
import About from '../components/about'
import Instructors from '../components/instructors'
import Pricing from '../components/pricing'
import Pools from '../components/pools'

export default function Index() {
  return (
    <div className={styles.page}>
      <Nav />
      <main id="main">
        <Header />
        <Photos />
        <About />
        <Instructors />
        <Pricing />
        <Pools />
        <ParentTot />
      </main>
    </div>
  )
}
