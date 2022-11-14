import './App.css';
import ImgixClient from '@imgix/js-core';
import { useState, useEffect, useMemo, useRef, startTransition } from 'react';
import Slider from '@mui/material/Slider';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import { useNavigate, useLocation } from "react-router-dom";
import md5 from 'md5';

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getStorage, ref, uploadBytes, getDownloadURL, listAll } from "firebase/storage";


const client = new ImgixClient({
  domain: 'assets.imgix.net',
  secureURLToken: '<SECURE TOKEN>',
});
const custom_client = new ImgixClient({
  domain: 'dalvarez.imgix.net',
  secureURLToken: 'HBNcuTvMTSFmfAqW',
});
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDduVn4iRMOqg-FYS5ttzBI-0WwKX4iFQk",
  authDomain: "pipette-serverless-backend.firebaseapp.com",
  projectId: "pipette-serverless-backend",
  storageBucket: "pipette-serverless-backend.appspot.com",
  messagingSenderId: "178467094711",
  appId: "1:178467094711:web:55fa18e2e561f1c7c00d32",
  measurementId: "G-7EW9FRZXNQ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const storage = getStorage(app, 'gs://doctoralvarez');


const ADJUSTMENTS = [
  ['Brightness', 'bri'],
  ['Contrast', 'con'],
  ['Exposure', 'exp'],
  ['Gamma', 'gam'],
  ['Highlight', 'high'],
  ['Hue Shift', 'hue'],
  ['Invert', 'invert'],
  ['Saturation', 'sat'],
  ['Shadow', 'shad'],
  ['Sharpen', 'sharp'],
  ['Unsharp Mask', 'usm'],
  ['Unsharp Mask Radius', 'usmrad'],
  ['Vibrance', 'vib']
]

function App() {
  console.log(storage)
  const [baseURL, setBaseURL] = useState('https://assets.imgix.net/unsplash/alarmclock.jpg')
  const [options, setOptions] = useState({})
  const [displayURL, setDisplayURL] = useState('')
  const [isOpen, setOpen] = useState(true)
  const sideRef = useRef()
  const closeRef = useRef()
  const handleSide = (e) => {
    if (isOpen) {
      sideRef.current.classList.add('close')
      setTimeout(() => {
        closeRef.current.style.opacity = '1'
      },500) 
    } else {
      sideRef.current.classList.remove('close')
      closeRef.current.style.opacity = '0'
    }
    console.log(isOpen)
    setOpen(!isOpen)
  }
  return (
    <div className="App">
      <div ref={sideRef} className="sideBarContainer">
        <div style={{padding: '20px', background: 'white', color: 'black'}}><span onClick={handleSide} style={{marginLeft: '-38px', marginRight: '28px', cursor: 'pointer', color: 'red'}}>◀</span>SELECT IMAGE</div>
      <div className='sideBar'>
        <SideBar setURL={setBaseURL}/>
      </div>
      <FileUploadSingle setBaseURL={setBaseURL}/>
      </div>
      <div className='mainComponent'>
        <span ref={closeRef} style={{ position: 'fixed', top: '40px', left: '40px', zIndex: 10, cursor: 'pointer', opacity: '0', color: 'red'}} onClick={handleSide}>▶</span>
        <div className='topURL'><p>{decodeURIComponent(displayURL)}</p><span onClick={() => navigator.clipboard.writeText(displayURL)}>➕</span></div>
        <RenderImage options={options} baseURL={baseURL} displayURL={setDisplayURL} />
        <div className='optionsComponent'>
          <OptionsComponent setOptions={setOptions} />
        </div>
      </div>
    </div>
  );
}

export default App;

const RenderImage = ({options, baseURL, displayURL}) => {
  const [finalURL, setFinalURL] = useState('')
  const navigate = useNavigate()
  console.log(finalURL)
  const location = useLocation()
  const locationURL = useMemo(() => location.search.split('?finalURL=')[1],[location])

  useEffect(() => {
    displayURL(locationURL)
    setFinalURL(locationURL)
  },[displayURL, locationURL, setFinalURL])
  
  useEffect(() => {
    if (baseURL.includes('assets.imgix')) {
      const url = client.buildURL(baseURL.split('assets.imgix.net')[1], options);
      console.log('effect called', url)
      displayURL(url)
      setFinalURL(url)
      navigate(`?finalURL=${url}`)
    } else {
      const url = custom_client.buildURL(baseURL.split('dalvarez.imgix.net')[1], options);
      console.log('effect called', url)
      displayURL(url)
      setFinalURL(url)
      navigate(`?finalURL=${url}`)
    }
      
  },[options, baseURL, navigate, displayURL])

  return (
      <div style={{ cursor: 'pointer'}} className='renderComponent'>
        {
          finalURL ? <a href={finalURL}><img className='renderImg' src={finalURL} alt='rendered'></img></a> : null
        }
        </div>
  )
}


const SideBar = ({setURL}) => {
  const [assets, setAssets] = useState([]);
  const [fbAssets, setFbAssets] = useState([]);
  
  useEffect(() => {
    const listRef = ref(storage, 'gs://doctoralvarez/');
    listAll(listRef)
    .then(res => {
      return setFbAssets(res.items.map(item => ({name: item.name, url: getDownloadURL(item).then(data => data)}) ))
    })

    fetch('https://storage.googleapis.com/nanlabs-engineering-technical-interviews/imgix-samples-list.json')
      .then(res => res.json())
      .then(data => setAssets(data))
  },[])
  console.log(fbAssets)
  if (assets.length > 0) {
    const finalAssets = [...assets, ...fbAssets]
    return finalAssets.map(asset => <div key={asset.name} onClick={() => {
    if (typeof(asset.url) === 'object') {
      return (asset.url.then(data => setURL(`https://dalvarez.imgix.net/${data}`)))
    } else {
      return setURL(asset.url)
    }
    }} className='imgName' style={{padding: '20px'}}>{asset.name.replace('.jpg','').replace('.JPG','').toUpperCase()}</div>)
  } else {
    return <div>LOADING...</div>
  }
}

const OptionsComponent = ({setOptions}) => {
  const [orient, setOrient] = useState(1);
  const [rot, setRot] = useState(0);
  const [slide, setSlide] = useState('bri');
  const [slideValue, setSlideValue] = useState(0)
  const [slides, setSlides] = useState({})
  
  const handleOptionsUpdate = ({target}) => {
      if (target.checked) {
        target.checked = false
        target.classList.remove('flip_selected')
        setOptions(prevOptions => {
          delete prevOptions[target.dataset.opt_type];
          return {...prevOptions};
        })
      } else {
        let customArray = Array.from(target.parentElement.children)
        customArray.forEach(child => {
          child.checked = false
          child.classList.remove('flip_selected')
        })
        target.checked = true
        target.classList.add('flip_selected');
        setOptions(prevOptions => {
          prevOptions[`${target.dataset.opt_type}`] = `${target.dataset.opt_value}`
          return {...prevOptions}
        })
      }
      
  }
  const handleOrientUpdate = ({target}) => {
      setOrient(target.value)
      setOptions(prevOptions => ({...prevOptions, orient: target.value}))
  }
  const handleRotUpdate = ({target}) => {
    setRot(target.value)
    setOptions(prevOptions => ({...prevOptions, rot: target.value}))
  }
  const handleAdjustmentUpdate = (e) => {
    setSlideValue(e.target.value)
    setSlides(prevSlides => {
      prevSlides[slide] = e.target.value
      return {...prevSlides}
    })
    setOptions(prevOptions => {
      prevOptions[slide] = e.target.value
      return {...prevOptions}
    })
  }
  const handleSlideSelection = (e) => {
    let slideArray = Array.from(e.target.parentElement.children)
    slideArray.forEach(child => child.classList.remove('slide_selected'))
    e.target.classList.add('slide_selected')
    setSlideValue(slides[e.target.id] || 0)
    setSlide(e.target.id)
  }
  const handleReset = (e) => {
    setSlides({})
    setSlideValue(0)
    setOptions(prevOptions => ({flip: prevOptions.flip, rot: prevOptions.rot, orient: prevOptions.orient}))
  }

  return (
    <>
      <div className='rotation'>
        <div className='rotationTitle'>ROTATION</div>
        <div className='secondLayer'>
          <div className='flip'>
            <div className='optTitle'>Flip Axis</div>
            <div style={{display: 'flex', overflow: 'scroll', width: '100%', paddingBottom: '13px', marginTop: '10px', marginRight: '10px'}}className='flipContainer'>
              <div onClick={handleOptionsUpdate} data-opt_type='flip' data-opt_value='v' className='vertical'>Vertical</div>
              <div onClick={handleOptionsUpdate} data-opt_type='flip' data-opt_value='h' className='horizontal'>Horizontal</div>
              <div onClick={handleOptionsUpdate} data-opt_type='flip' data-opt_value='hv' className='diagonal'>Diagonal</div>
            </div>
          </div>
          <div className='orientation'>
          <div className='optTitle'>Orientation</div>
          <FormControl sx={{ m: 1, minWidth: 120 }} size="small">
              <InputLabel id="demo-select-small"></InputLabel>
              <Select
                labelId="demo-select-small"
                id="demo-select-small"
                value={orient}
                onChange={handleOrientUpdate}
              >
                <MenuItem value="">
                  <em>None</em>
                </MenuItem>
                <MenuItem value={1}>1</MenuItem>
                <MenuItem value={2}>2</MenuItem>
                <MenuItem value={3}>3</MenuItem>
                <MenuItem value={4}>4</MenuItem>
                <MenuItem value={5}>5</MenuItem>
                <MenuItem value={6}>6</MenuItem>
                <MenuItem value={7}>7</MenuItem>
                <MenuItem value={8}>8</MenuItem>
                <MenuItem value={90}>90</MenuItem>
                <MenuItem value={180}>180</MenuItem>
                <MenuItem value={270}>270</MenuItem>
              </Select>
        </FormControl>
          </div>
          <div className='rot'>
          <div className='optTitle'>Rotation</div>
              <Slider
                  size="small"
                  defaultValue={0}
                  aria-label="Small"
                  valueLabelDisplay="auto"
                  onChange={handleRotUpdate}
                  value={rot}
                  max={360}
                  step={10}
              />
          </div>
        </div>
        
      </div>
      <div className='adjustments'>
        
        <div className='carousel'>
          {
            ADJUSTMENTS.map(adj => <div key={adj[1]} id={adj[1]} onClick={handleSlideSelection} className='slide'>{adj[0]}</div>)
          }
        </div>
        <Slider
                  size="small"
                  defaultValue={0}
                  aria-label="Small"
                  valueLabelDisplay="on"
                  onChange={handleAdjustmentUpdate}
                  value={slideValue}
                  max={slide === 'high' ? 0 : slide === 'hue' ? 360 : slide === 'invert' ? 1 : slide === 'usmrad' ? 500 : 100}
                  min={slide === 'hue' || slide === 'shad' || slide === 'sharp' || slide === 'usmrad' ? 0 : slide === 'invert' ? 0 : -100}
              />
              <div className="reset" onClick={handleReset}>RESET</div>
      </div>
    </>
  )
}

function FileUploadSingle({setBaseURL}) {
  const [file, setFile] = useState()
  const fileRef = useRef()
  const handleFileChange = (e) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };
  
  const handleUploadClick = () => {
    if (!file) {
      return;
    }
    const storageRef = ref(storage, `${file?.name}`);
    uploadBytes(storageRef, file).then((snapshot) => {
      fileRef.current.value = ""
      setFile(null)
      window.location.reload()
    });
  }
  return (
    <div style={{marginTop: '20px'}}>
      <div style={{ paddingTop: '20px', 
                    marginBottom: '7px',
                    textAlign: 'start',
                    paddingLeft: '10px',
                    borderTop: '1px solid',
                    paddingtop: '10px',
                    }}>Upload Your File:</div>
      <input ref={fileRef} type="file" onChange={handleFileChange} />

      <div>{file && `${file.name} - ${file.type}`}</div>

      <button id="upCTA" style={{cursor:'pointer',padding: '15px', margin: '15px', borderRadius: '20px', border: 'none', transition: 'all ease 300ms'}} onClick={handleUploadClick}>Upload</button>
      <br></br>
      <div id="signature" style={{ marginBottom: '10px'}}>React App by Diego Alvarez 🚀</div>
    </div>
  );
}
